# The structured OFF quantity describes the whole retail pack, including multipacks.
normalize_quantity <- function(quantity, unit, text) {
  factors <- c(g = .001, kg = 1, ml = .001, cl = .01, dl = .1, l = 1)
  kind <- c(g = "kg", kg = "kg", ml = "L", cl = "L", dl = "L", l = "L")
  unit <- tolower(trimws(as.character(unit)))
  quantity <- suppressWarnings(as.numeric(quantity))
  base <- if (!is.na(unit) && unit %in% names(factors) && is.finite(quantity) && quantity > 0) quantity * factors[[unit]] else NA_real_
  basis <- if (!is.na(base)) kind[[unit]] else NA_character_
  txt <- if (is.na(text)) "" else tolower(trimws(gsub(",", ".", text, fixed = TRUE)))
  txt <- gsub("[\u00a0\u202f]", " ", txt)
  number <- "([0-9]+(?:\\.[0-9]+)?)"
  simple <- stringr::str_match(txt, paste0("^", number, "\\s*(kg|g|ml|cl|dl|l)$"))
  multi <- stringr::str_match(txt, paste0("^", number, "\\s*[x\u00d7*]\\s*", number, "\\s*(kg|g|ml|cl|dl|l)$"))
  reverse <- stringr::str_match(txt, paste0("^", number, "\\s*(kg|g|ml|cl|dl|l)\\s*[x\u00d7*]\\s*", number, "$"))
  outer <- stringr::str_match(txt, paste0("^", number, "\\s*(kg|g|ml|cl|dl|l)\\s*\\(\\s*", number, "\\s*[x\u00d7*]\\s*", number, "\\s*(kg|g|ml|cl|dl|l)\\s*\\)$"))
  text_conflict <- FALSE
  parsed <- NA_real_; parsed_basis <- NA_character_; multipack <- grepl("[0-9]\\s*[x\u00d7*]|[x\u00d7*]\\s*[0-9]", txt)
  if (!is.na(simple[1, 1])) { parsed <- as.numeric(simple[1, 2]) * factors[[simple[1, 3]]]; parsed_basis <- kind[[simple[1, 3]]] }
  if (!is.na(multi[1, 1])) { parsed <- as.numeric(multi[1, 2]) * as.numeric(multi[1, 3]) * factors[[multi[1, 4]]]; parsed_basis <- kind[[multi[1, 4]]] }
  if (!is.na(reverse[1, 1])) { parsed <- as.numeric(reverse[1, 2]) * as.numeric(reverse[1, 4]) * factors[[reverse[1, 3]]]; parsed_basis <- kind[[reverse[1, 3]]] }
  if (!is.na(outer[1, 1])) {
    parsed <- as.numeric(outer[1, 2]) * factors[[outer[1, 3]]]
    parsed_basis <- kind[[outer[1, 3]]]
    inner <- as.numeric(outer[1, 4]) * as.numeric(outer[1, 5]) * factors[[outer[1, 6]]]
    text_conflict <- parsed_basis != kind[[outer[1, 6]]] || abs(parsed - inner) > max(.00001, parsed * .02)
  }
  status <- if (is.na(base)) "missing_or_unsupported" else "structured_only"
  if (is.finite(parsed) && parsed > 0) {
    if (is.na(base)) { base <- parsed; basis <- parsed_basis; status <- "text_derived" }
    else status <- if (basis == parsed_basis && abs(base - parsed) <= max(.00001, parsed * .02)) "confirmed" else "conflict"
  } else if (multipack) status <- "multipack_unresolved"
  if (text_conflict) status <- "conflict"
  tibble::tibble(quantity_base = as.numeric(base), unit_basis = basis, quantity_status = status,
    is_multipack = multipack, quantity_usable = is.finite(base) && base > 0 && !status %in% c("conflict", "multipack_unresolved"))
}
