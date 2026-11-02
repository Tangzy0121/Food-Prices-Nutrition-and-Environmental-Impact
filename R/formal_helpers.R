source("R/00_common.R", encoding = "UTF-8")
source("R/quantity_helpers.R", encoding = "UTF-8")
formal_root <- paste0("data/raw/open_food_facts/formal_", run_date)
dir.create(formal_root, recursive = TRUE, showWarnings = FALSE)
request_clock <- new.env(parent = emptyenv())
formal_request <- function(url, query, path, service = "op", max_attempts = 3L, post = FALSE) {
  identity <- list(url = url, query = query)
  if (post) identity$method <- "POST"
  key <- digest::digest(jsonlite::toJSON(identity, auto_unbox = TRUE), algo = "sha256")
  if (file.exists(path)) {
    cached <- jsonlite::read_json(path)
    if (!identical(cached$request_key, key)) stop("Cache request mismatch: ", path)
    return(cached)
  }
  dir.create(dirname(path), recursive = TRUE, showWarnings = FALSE)
  interval <- if (service == "off_search") 6.5 else if (service == "off_product") 4.3 else .9
  last_error <- ""
  for (attempt in seq_len(max_attempts)) {
    last <- request_clock[[service]]
    if (!is.null(last)) {
      pause <- interval - as.numeric(difftime(Sys.time(), last, units = "secs"))
      if (pause > 0) Sys.sleep(pause)
    }
    request_clock[[service]] <- Sys.time()
    req <- httr2::request(url) %>% httr2::req_user_agent("FoodRetailFinalProject/1.0 (academic food data project)") %>%
      httr2::req_timeout(35) %>% httr2::req_error(is_error = function(resp) FALSE)
    req <- if (post) do.call(httr2::req_body_form, c(list(req), query)) else do.call(httr2::req_url_query, c(list(req), query))
    response <- tryCatch(httr2::req_perform(req), error = function(e) e)
    if (!inherits(response, "error")) {
      status <- httr2::resp_status(response)
      body <- tryCatch(httr2::resp_body_json(response), error = function(e) NULL)
      if (status %in% c(200L, 404L) && !is.null(body)) {
        result <- list(request_key = key, url = url, query = query, method = if (post) "POST" else "GET", fetched_at_utc = utc_now(), http_status = status, body = body)
        jsonlite::write_json(result, path, auto_unbox = TRUE, pretty = TRUE, null = "null")
        return(result)
      }
      last_error <- paste("HTTP", status)
      if (status >= 400 && status < 500 && status != 429) break
    } else last_error <- conditionMessage(response)
    message("Request retry ", attempt, "/", max_attempts, ": ", last_error)
    if (attempt < max_attempts) Sys.sleep(if (attempt == 1L) 5 else 15)
  }
  stop("Acquisition failed after bounded retries: ", url, " / ", last_error)
}
json_array <- function(x) as.character(jsonlite::toJSON(as.character(unlist(x, use.names = FALSE)), auto_unbox = FALSE))
response_hashes <- function(paths) tibble(file = paths, sha256 = unname(vapply(paths, function(f) digest::digest(file = f, algo = "sha256"), character(1))))
write_utf8 <- function(lines, path) { con <- file(path, "wb"); on.exit(close(con)); writeLines(enc2utf8(lines), con, useBytes = TRUE) }
