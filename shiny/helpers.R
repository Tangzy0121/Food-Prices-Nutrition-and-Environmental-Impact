# Shared, deterministic data and comparison rules for the consumer Find/Compare dashboard.
# No network calls. Kept in sync with website/src/dashboardModel.ts and export-dashboard.R.

category_names <- c(
  biscuits = "Biscuits",
  breakfast_cereals = "Breakfast cereals",
  dark_chocolates = "Dark chocolate",
  fruit_juices = "Fruit juices"
)
category_names_zh <- c(
  biscuits = "饼干",
  breakfast_cereals = "早餐谷物",
  dark_chocolates = "黑巧克力",
  fruit_juices = "果汁"
)
nutri_levels <- letters[1:5]
environment_levels <- c("a-plus", letters[1:6])

subtype_rules <- list(
  biscuits = c(
    filled_biscuits = "filled-biscuits|sandwich-biscuits|jaffa-cakes",
    chocolate_biscuits = "chocolate.*biscuits|chocolate-chip-cookies|digestives-covered-with-chocolate",
    shortbread = "shortbread-cookies|brittany-style-galette-biscuits",
    plain_biscuits = "dry-biscuits|petit-beurre|digestive-biscuits"
  ),
  breakfast_cereals = c(
    rolled_oats = "rolled-oats|oat-flakes",
    crunchy_muesli = "crunchy-mueslis.*|crunchy-cereal-clusters.*|cereal-clusters-with-.*",
    muesli = "mueslis.*",
    filled_cereals = "filled-cereals.*",
    cereal_flakes = "corn-flakes.*|cereal-flakes.*",
    extruded_cereals = "extruded-cereals.*"
  ),
  dark_chocolates = c(
    cooking_chocolate = "dark-chocolate-bars-for-cooking",
    filled_chocolate = "filled-(dark-)?chocolates|chocolate-candies",
    flavored_chocolate = "(dark-)?chocolates-with-.*|salted-(dark-)?chocolates",
    chocolate_bars = "dark-chocolate-bar.*|chocolate-bars"
  ),
  fruit_juices = c(
    nectars = "fruit-nectars",
    mixed_juices = "(squeezed-)?multifruit-juices|fruit-and-vegetable-juices",
    orange_juice = "(squeezed-)?orange-juices.*",
    apple_juice = "(squeezed-)?apple-juices.*",
    grape_juice = "(squeezed-)?grape-juices.*",
    pineapple_juice = "(squeezed-)?pineapple-juices.*",
    lemon_juice = "(squeezed-)?lemon-juice.*",
    other_concentrate = "fruit-juices-from-concentrate"
  )
)

subtype_labels <- list(
  filled_biscuits = c(en = "Filled biscuits", zh = "夹心饼干"),
  chocolate_biscuits = c(en = "Chocolate biscuits", zh = "巧克力饼干"),
  shortbread = c(en = "Shortbread", zh = "黄油酥饼"),
  plain_biscuits = c(en = "Plain biscuits", zh = "原味饼干"),
  rolled_oats = c(en = "Rolled oats", zh = "燕麦片"),
  crunchy_muesli = c(en = "Crunchy muesli", zh = "脆麦片"),
  muesli = c(en = "Muesli", zh = "混合麦片"),
  filled_cereals = c(en = "Filled cereals", zh = "夹心谷物"),
  cereal_flakes = c(en = "Cereal flakes", zh = "谷物脆片"),
  extruded_cereals = c(en = "Puffed cereals", zh = "膨化谷物"),
  cooking_chocolate = c(en = "Cooking chocolate", zh = "烘焙黑巧克力"),
  filled_chocolate = c(en = "Filled chocolate", zh = "夹心巧克力"),
  flavored_chocolate = c(en = "Chocolate with added flavours", zh = "风味黑巧克力"),
  chocolate_bars = c(en = "Chocolate bars", zh = "黑巧克力排块"),
  nectars = c(en = "Fruit nectars", zh = "果肉饮料"),
  mixed_juices = c(en = "Mixed juices", zh = "混合果汁"),
  orange_juice = c(en = "Orange juice", zh = "橙汁"),
  apple_juice = c(en = "Apple juice", zh = "苹果汁"),
  grape_juice = c(en = "Grape juice", zh = "葡萄汁"),
  pineapple_juice = c(en = "Pineapple juice", zh = "菠萝汁"),
  lemon_juice = c(en = "Lemon juice", zh = "柠檬汁"),
  other_concentrate = c(en = "Other juice from concentrate", zh = "其他浓缩还原果汁")
)

ui_strings <- list(
  find_better = c(en = "Find better food", zh = "找到更好的食物"),
  snapshot = c(en = "France · 2024–2025 quotes", zh = "法国 · 2024–2025 年报价"),
  find_tab = c(en = "Find products", zh = "找商品"),
  compare_tab = c(en = "Compare products", zh = "商品对比"),
  food_category = c(en = "Food category", zh = "食品类别"),
  select_category = c(en = "Select category and food type", zh = "选择大类和细分类"),
  all_types = c(en = "All food types", zh = "全部细分类"),
  food_type = c(en = "Food type", zh = "食品细分类"),
  price_range = c(en = "Select a price range", zh = "选择价格区间"),
  price_hint = c(en = "Drag either end to set the range.", zh = "拖动左右端点，设置最低价和最高价。"),
  products_in_range = c(en = "products in range", zh = "款商品在区间内"),
  up_to_median = c(en = "Up to the median", zh = "不超过中位价"),
  reset_range = c(en = "Reset range", zh = "重置价格"),
  choose_type_first = c(en = "Choose a food type to see its price distribution.", zh = "选好食品类别后，这里会显示价格分布。"),
  products = c(en = "Products", zh = "商品列表"),
  showing = c(en = "Showing", zh = "显示"),
  matching = c(en = "matching products", zh = "款匹配商品"),
  sort = c(en = "Sort products", zh = "商品排序"),
  sort_low = c(en = "Price: low to high", zh = "价格从低到高"),
  sort_high = c(en = "Price: high to low", zh = "价格从高到低"),
  sort_offers = c(en = "Most regular quotes", zh = "常规报价从多到少"),
  sort_name = c(en = "Product name", zh = "商品名称"),
  search = c(en = "Search products", zh = "搜索商品"),
  search_ph = c(en = "Name, brand or barcode", zh = "名称、品牌或条码"),
  more_filters = c(en = "More filters", zh = "更多筛选"),
  nutrition = c(en = "Nutrition grade", zh = "营养等级"),
  environment = c(en = "Environmental grade", zh = "环境等级"),
  all_grades = c(en = "All grades", zh = "所有等级"),
  unknown = c(en = "Unavailable", zh = "未提供"),
  price_evidence = c(en = "Price evidence", zh = "报价依据"),
  any_quotes = c(en = "Any quote count", zh = "不限报价次数"),
  two_quotes = c(en = "At least 2 regular quotes", zh = "至少 2 条常规报价"),
  both_c = c(en = "Both grades C or better", zh = "两项等级均为 C 或更好"),
  clear_filters = c(en = "Clear filters", zh = "清除筛选"),
  no_match = c(en = "No products match the current price and filters.", zh = "没有商品符合当前价格区间和筛选。"),
  show_first_five = c(en = "Show first five", zh = "收起至前 5 款"),
  show_all = c(en = "Show all", zh = "展开全部"),
  selected = c(en = "Selected product", zh = "所选商品"),
  select_hint = c(en = "Select a product in the list to see its price, grades and quote history.", zh = "从左侧列表选择一款商品，查看价格、等级和报价情况。"),
  unit_price = c(en = "Historical unit price", zh = "历史单位价格"),
  regular_quotes = c(en = "Regular quotes", zh = "常规报价"),
  latest = c(en = "Latest record", zh = "最近记录"),
  compare_this = c(en = "Compare this product", zh = "去对比这款商品"),
  product_plot = c(en = "Product plot", zh = "商品点图"),
  compare_metric = c(en = "Compare price with", zh = "价格对照指标"),
  need_category = c(en = "Choose a food category before comparing products.", zh = "先选择食品类别，再选择一款参照商品。"),
  go_find = c(en = "Find products", zh = "找商品"),
  reference = c(en = "Reference product", zh = "参照商品"),
  change_ref = c(en = "Change reference", zh = "更换参照"),
  clear_ref = c(en = "Clear reference", zh = "清除参照"),
  need_reference = c(en = "Select a product on Find products to start a comparison.", zh = "在「找商品」中选择一款商品作为参照。"),
  lower_price = c(en = "Lower unit price", zh = "单位价更低"),
  nutrition_holds = c(en = "Nutrition grade holds or improves", zh = "营养等级不降"),
  environment_holds = c(en = "Environmental grade holds or improves", zh = "环境等级不降"),
  same_type = c(en = "Same food type only", zh = "仅同类细分类"),
  whole_category = c(en = "Whole category", zh = "整个大类"),
  use_range = c(en = "Use selected price range", zh = "沿用所选价格区间"),
  alternatives = c(en = "Alternatives", zh = "备选商品"),
  no_alts = c(en = "No alternatives match the current criteria.", zh = "没有商品符合当前对比条件。"),
  export = c(en = "Export comparison", zh = "导出对比结果"),
  export_products = c(en = "Export filtered products", zh = "导出筛选商品"),
  same = c(en = "Same", zh = "持平"),
  better = c(en = "Improved", zh = "提升"),
  worse = c(en = "Lower", zh = "下降"),
  unclassified = c(en = "Unclassified", zh = "未分类"),
  outside_filters = c(en = "Outside the current list filters", zh = "这款商品在当前筛选范围之外。"),
  details = c(en = "Comparison details", zh = "商品对比明细"),
  pack = c(en = "Pack price and size", zh = "整包价格与规格"),
  quote_records = c(en = "Quote records", zh = "报价记录")
)

tr <- function(key, language = "en") {
  entry <- ui_strings[[key]]
  if (is.null(entry)) return(key)
  entry[[if (identical(language, "zh")) "zh" else "en"]]
}

grade_label <- function(x, language = "en") {
  ifelse(is.na(x), tr("unknown", language), ifelse(x == "a-plus", "A+", toupper(x)))
}

product_name <- function(p) {
  name <- trimws(as.character(p$product_name))
  ifelse(is.na(name) | !nzchar(name), as.character(p$code), name)
}

subtype_label <- function(subtype, language = "en") {
  if (is.null(subtype) || length(subtype) == 0L || is.na(subtype) || identical(subtype, "unknown") || !nzchar(subtype)) {
    return(tr("unclassified", language))
  }
  entry <- subtype_labels[[as.character(subtype)]]
  if (is.null(entry)) return(as.character(subtype))
  entry[[if (identical(language, "zh")) "zh" else "en"]]
}

category_label <- function(category, language = "en") {
  if (identical(language, "zh")) category_names_zh[[category]] else category_names[[category]]
}

assign_product_subtypes <- function(p) {
  p$subtype <- vapply(seq_len(nrow(p)), function(i) {
    tags <- tryCatch(sub("^en:", "", jsonlite::fromJSON(p$categories_json[[i]])), error = function(e) character())
    rules <- subtype_rules[[as.character(p$category[[i]])]]
    if (is.null(rules) || !length(tags)) return(NA_character_)
    matches <- vapply(rules, function(pattern) any(grepl(paste0("^(", pattern, ")$"), tags)), logical(1))
    if (any(matches)) names(rules)[which(matches)[1L]] else NA_character_
  }, character(1))
  p
}

load_dashboard_data <- function(root) {
  path <- file.path(root, "data/processed/step4_v1_1/analysis_products.rds")
  if (!file.exists(path)) stop("Corrected data missing. Run scripts/run_step4.ps1 from the project root first.")
  p <- readRDS(path)
  stopifnot(
    nrow(p) == 598L, is.character(p$code), !anyDuplicated(p$code),
    sum(p$joint_grades_price) == 583L,
    all(is.na(p$environment_grade) | p$environment_grade %in% environment_levels),
    sum(p$environment_grade == "f", na.rm = TRUE) == 16L,
    all(p$representative_price > 0)
  )
  assign_product_subtypes(p)
}

load_dashboard_quotes <- function(root, codes) {
  path <- file.path(root, "data/processed/frozen_v1/price_observations.rds")
  if (!file.exists(path)) stop("Price observations missing. Restore data/processed/frozen_v1/price_observations.rds.")
  q <- readRDS(path)
  keep <- q$code %in% codes & is.finite(q$unit_price_eur) & q$unit_price_eur > 0
  q <- q[keep, , drop = FALSE]
  out <- data.frame(
    id = as.character(q$price_id),
    code = q$code,
    date = as.character(q$date),
    unit_price = q$unit_price_eur,
    package_price = q$price_eur,
    store = ifelse(q$location_id > 0, as.character(q$location_id), NA_character_),
    city = ifelse(is.na(q$city) | !nzchar(trimws(as.character(q$city))), NA_character_, trimws(as.character(q$city))),
    discounted = q$price_is_discounted,
    kept = q$representative_keep,
    stringsAsFactors = FALSE
  )
  out[order(out$date, out$id), , drop = FALSE]
}

matches_grade_filter <- function(grade, filter, levels) {
  if (is.null(filter) || !nzchar(filter)) return(TRUE)
  value <- ifelse(is.na(grade), "unknown", as.character(grade))
  if (identical(filter, "through-c")) {
    rank <- match(value, levels)
    return(!is.na(rank) && rank <= match("c", levels))
  }
  identical(value, filter)
}

scope_products <- function(p, category, subtype = "") {
  d <- p[p$category == category, , drop = FALSE]
  if (!is.null(subtype) && nzchar(subtype)) {
    key <- ifelse(is.na(d$subtype), "unknown", as.character(d$subtype))
    d <- d[key == subtype, , drop = FALSE]
  }
  d
}

filter_find_products <- function(p, category, subtype = "", range = NULL, nutrition = "",
                                 environment = "", multiple_offers = FALSE, query = "") {
  d <- scope_products(p, category, subtype)
  if (!is.null(range) && length(range) == 2L && all(is.finite(range))) {
    d <- d[d$representative_price >= range[1] & d$representative_price <= range[2], , drop = FALSE]
  }
  if (nzchar(nutrition)) {
    d <- d[vapply(d$nutri_grade, matches_grade_filter, logical(1), filter = nutrition, levels = nutri_levels), , drop = FALSE]
  }
  if (nzchar(environment)) {
    d <- d[vapply(d$environment_grade, matches_grade_filter, logical(1), filter = environment, levels = environment_levels), , drop = FALSE]
  }
  if (isTRUE(multiple_offers)) d <- d[d$n_valid_regular_offers >= 2L, , drop = FALSE]
  if (!is.null(query) && nzchar(trimws(query))) {
    q <- tolower(trimws(query))
    hay <- tolower(paste(d$product_name, d$brands, d$code, sep = " "))
    d <- d[grepl(q, hay, fixed = TRUE), , drop = FALSE]
  }
  d
}

grade_change <- function(reference, comparison, levels) {
  before <- if (is.na(reference)) -1L else match(as.character(reference), levels)
  after <- if (is.na(comparison)) -1L else match(as.character(comparison), levels)
  if (is.na(before) || before < 1L || is.na(after) || after < 1L) return("missing")
  if (after == before) return("same")
  if (after < before) "better" else "worse"
}

maintains_grade <- function(change) change %in% c("same", "better")

comparison_rows <- function(products, reference, same_type = TRUE, range = NULL, use_range = TRUE,
                            lower_price = TRUE, nutrition = TRUE, environment = TRUE) {
  if (nrow(reference) != 1L) return(products[FALSE, , drop = FALSE])
  d <- products[products$category == reference$category & products$code != reference$code, , drop = FALSE]
  if (isTRUE(same_type) && !is.na(reference$subtype)) {
    d <- d[!is.na(d$subtype) & d$subtype == reference$subtype, , drop = FALSE]
  }
  if (isTRUE(use_range) && !is.null(range) && length(range) == 2L && all(is.finite(range))) {
    d <- d[d$representative_price >= range[1] & d$representative_price <= range[2], , drop = FALSE]
  }
  if (!nrow(d)) return(d)
  d$price_delta <- d$representative_price - reference$representative_price
  d$nutrition_change <- vapply(seq_len(nrow(d)), function(i) {
    grade_change(reference$nutri_grade, d$nutri_grade[i], nutri_levels)
  }, character(1))
  d$environment_change <- vapply(seq_len(nrow(d)), function(i) {
    grade_change(reference$environment_grade, d$environment_grade[i], environment_levels)
  }, character(1))
  keep <- rep(TRUE, nrow(d))
  if (isTRUE(lower_price)) keep <- keep & d$price_delta < -1e-9
  if (isTRUE(nutrition)) keep <- keep & vapply(d$nutrition_change, maintains_grade, logical(1))
  if (isTRUE(environment)) keep <- keep & vapply(d$environment_change, maintains_grade, logical(1))
  d <- d[keep, , drop = FALSE]
  d[order(d$price_delta, product_name(d)), , drop = FALSE]
}

grade_badge <- function(x, language = "en") {
  value <- as.character(x)
  shiny::span(
    class = paste0("dash-grade", if (is.na(value)) "" else paste0(" grade-", value)),
    `data-grade` = if (is.na(value)) "unknown" else value,
    grade_label(value, language)
  )
}

unit_price_text <- function(price, unit) sprintf("€%.2f/%s", price, unit)

product_list_html <- function(d, selected_code = NULL, language = "en", expanded = FALSE) {
  if (!nrow(d)) {
    return(shiny::div(class = "dash-list-empty", shiny::p(tr("no_match", language))))
  }
  visible <- if (isTRUE(expanded) || nrow(d) <= 5L) d else d[seq_len(5L), , drop = FALSE]
  shiny::tags$ul(
    class = "dash-simple-list",
    `data-expanded` = tolower(as.character(isTRUE(expanded) || nrow(d) <= 5L)),
    lapply(seq_len(nrow(visible)), function(i) {
      code <- visible$code[i]
      meta <- paste(c(visible$brands[i], visible$quantity_text[i]), collapse = " · ")
      if (!nzchar(trimws(meta)) || meta %in% c(" · ", "NA · NA", "NA")) meta <- code
      shiny::tags$li(
        `data-product` = code,
        shiny::tags$button(
          type = "button",
          class = "dash-product-row",
          `data-inspect-code` = code,
          `data-target` = "selected_code",
          `aria-pressed` = tolower(identical(code, selected_code)),
          onclick = sprintf("Shiny.setInputValue('selected_code','%s',{priority:'event'})", code),
          shiny::span(
            class = "dash-list-product",
            shiny::tags$strong(product_name(visible[i, , drop = FALSE])),
            shiny::tags$small(meta)
          ),
          shiny::span(
            class = "dash-list-price",
            shiny::tags$strong(unit_price_text(visible$representative_price[i], visible$target_unit[i])),
            shiny::tags$small(class = "dash-list-quote-count", visible$n_valid_regular_offers[i], " ", tr("regular_quotes", language))
          ),
          shiny::span(
            class = "dash-list-grades",
            shiny::span(grade_badge(visible$nutri_grade[i], language)),
            shiny::span(grade_badge(visible$environment_grade[i], language))
          )
        )
      )
    })
  )
}

change_chip <- function(change, language = "en") {
  label <- switch(change,
    same = tr("same", language),
    better = tr("better", language),
    worse = tr("worse", language),
    tr("unknown", language)
  )
  shiny::span(class = paste0("dash-grade-change"), `data-change` = change, label)
}

alternatives_html <- function(rows, reference, language = "en", expanded = FALSE, open_code = NULL, quotes = NULL) {
  if (!nrow(rows)) {
    return(shiny::div(class = "dash-list-empty", shiny::p(tr("no_alts", language))))
  }
  visible <- if (isTRUE(expanded) || nrow(rows) <= 5L) rows else rows[seq_len(5L), , drop = FALSE]
  max_delta <- max(0.01, abs(visible$price_delta))
  zero <- 100
  shiny::div(
    class = "dash-alternatives",
    lapply(seq_len(nrow(visible)), function(i) {
      row <- visible[i, , drop = FALSE]
      code <- row$code
      open <- identical(code, open_code)
      width <- abs(row$price_delta) / max_delta * zero
      left <- if (row$price_delta < 0) zero - width else zero
      shiny::div(
        class = "dash-alt-row",
        `data-open` = tolower(open),
        shiny::tags$button(
          type = "button",
          class = "dash-alt-toggle",
          `data-inspect-code` = code,
          `data-target` = "open_compare_code",
          `aria-expanded` = tolower(open),
          onclick = sprintf("Shiny.setInputValue('open_compare_code','%s',{priority:'event'})", code),
          shiny::span(class = "dash-list-product",
            shiny::tags$strong(product_name(row)),
            shiny::tags$small(paste(c(row$brands, row$quantity_text), collapse = " · "))
          ),
          shiny::span(class = "dash-list-price",
            shiny::tags$strong(unit_price_text(row$representative_price, row$target_unit)),
            shiny::tags$small(sprintf("%+.2f", row$price_delta))
          ),
          shiny::span(class = "dash-price-track", shiny::tags$i(style = sprintf("left:%.2f%%;width:%.2f%%;", left, width))),
          shiny::span(class = "dash-list-grades",
            shiny::span(grade_badge(row$nutri_grade, language), change_chip(row$nutrition_change, language)),
            shiny::span(grade_badge(row$environment_grade, language), change_chip(row$environment_change, language))
          )
        ),
        if (open) comparison_detail_html(reference, row, quotes, language)
      )
    })
  )
}

comparison_detail_html <- function(reference, compared, quotes, language = "en") {
  unit <- reference$target_unit
  amount <- if (identical(unit, "L")) "100 ml" else "100 g"
  nutrients <- list(
    list("energy_kcal_100g", if (language == "zh") "能量" else "Energy", "kcal"),
    list("sugars_100g", if (language == "zh") "糖" else "Sugars", "g"),
    list("fat_100g", if (language == "zh") "总脂肪" else "Total fat", "g"),
    list("saturated_fat_100g", if (language == "zh") "饱和脂肪" else "Saturated fat", "g"),
    list("proteins_100g", if (language == "zh") "蛋白质" else "Protein", "g"),
    list("fiber_100g", if (language == "zh") "纤维" else "Fibre", "g"),
    list("salt_100g", if (language == "zh") "盐" else "Salt", "g")
  )
  fmt_val <- function(v, u) if (is.na(v) || !is.finite(v)) tr("unknown", language) else paste(format(round(v, 2), nsmall = 0), u)
  rows <- lapply(nutrients, function(item) {
    before <- reference[[item[[1]]]]
    after <- compared[[item[[1]]]]
    delta <- if (is.na(before) || is.na(after)) NA_real_ else after - before
    shiny::tags$tr(
      shiny::tags$th(scope = "row", item[[2]]),
      shiny::tags$td(fmt_val(before, item[[3]])),
      shiny::tags$td(fmt_val(after, item[[3]])),
      shiny::tags$td(if (is.na(delta)) "—" else sprintf("%+.2f %s", delta, item[[3]]))
    )
  })
  quote_table <- NULL
  if (!is.null(quotes) && nrow(quotes)) {
    q <- quotes[quotes$code %in% c(reference$code, compared$code), , drop = FALSE]
    q <- q[order(q$date, q$id), , drop = FALSE]
    if (nrow(q)) {
      quote_table <- shiny::div(
        class = "dash-table-wrap",
        shiny::tags$table(
          class = "dash-table",
          shiny::tags$thead(shiny::tags$tr(lapply(
            if (language == "zh") c("日期", "商品", "整包价", "单位价", "城市", "折扣", "纳入中位") else
              c("Date", "Product", "Pack", "Unit", "City", "Discounted", "Kept"),
            shiny::tags$th
          ))),
          shiny::tags$tbody(lapply(seq_len(min(nrow(q), 40L)), function(i) {
            shiny::tags$tr(
              shiny::tags$td(q$date[i]),
              shiny::tags$td(if (identical(q$code[i], reference$code)) tr("reference", language) else product_name(compared)),
              shiny::tags$td(sprintf("€%.2f", q$package_price[i])),
              shiny::tags$td(sprintf("€%.2f", q$unit_price[i])),
              shiny::tags$td(if (is.na(q$city[i])) "—" else q$city[i]),
              shiny::tags$td(if (isTRUE(q$discounted[i])) "yes" else "no"),
              shiny::tags$td(if (isTRUE(q$kept[i])) "yes" else "no")
            )
          }))
        )
      )
    }
  }
  shiny::section(
    class = "dash-compare",
    shiny::section(
      class = "dash-evidence-section",
      shiny::h3(tr("details", language)),
      shiny::p(class = "dash-muted", paste(if (language == "zh") "营养成分每" else "Nutrition per", amount)),
      shiny::div(
        class = "dash-table-wrap",
        shiny::tags$table(
          class = "dash-table dash-comparison-table",
          shiny::tags$thead(shiny::tags$tr(
            shiny::tags$th(if (language == "zh") "指标" else "Measure"),
            shiny::tags$th(tr("reference", language)),
            shiny::tags$th(if (language == "zh") "对比" else "Compared"),
            shiny::tags$th(if (language == "zh") "差值" else "Difference")
          )),
          shiny::tags$tbody(rows)
        )
      )
    ),
    shiny::section(
      class = "dash-evidence-section",
      shiny::h3(tr("pack", language)),
      shiny::p(sprintf("%s · %s",
        paste(tr("unit_price", language), unit_price_text(reference$representative_price, unit)),
        paste(if (language == "zh") "对比" else "Compared", unit_price_text(compared$representative_price, unit))
      )),
      shiny::p(sprintf("%s · %s",
        if (is.na(reference$quantity_text)) tr("unknown", language) else reference$quantity_text,
        if (is.na(compared$quantity_text)) tr("unknown", language) else compared$quantity_text
      ))
    ),
    if (!is.null(quote_table)) shiny::section(class = "dash-evidence-section", shiny::h3(tr("quote_records", language)), quote_table)
  )
}

metric_spec <- function(metric, unit = "kg") {
  nutrient_unit <- if (identical(unit, "L")) "g / 100 ml" else "g / 100 g"
  switch(metric,
    environment_grade = list(label = "Environmental grade", field = "environment_score", ordered = TRUE),
    nutri_grade = list(label = "Nutrition grade", field = "nutri_score", ordered = TRUE),
    nutri_score = list(label = "Nutrition score (lower is better)", field = "nutri_score", ordered = FALSE),
    sugars_100g = list(label = paste("Sugars", nutrient_unit), field = "sugars_100g", ordered = FALSE),
    saturated_fat_100g = list(label = paste("Saturated fat", nutrient_unit), field = "saturated_fat_100g", ordered = FALSE),
    fiber_100g = list(label = paste("Fibre", nutrient_unit), field = "fiber_100g", ordered = FALSE),
    stop("Unknown chart metric")
  )
}

scatter_products <- function(d, metric) {
  if (metric == "environment_grade") {
    d$view_value <- match(as.character(d$environment_grade), environment_levels)
    d$view_value[is.na(d$view_value)] <- 8L
  } else if (metric == "nutri_grade") {
    d$view_value <- match(as.character(d$nutri_grade), nutri_levels)
    d$view_value[is.na(d$view_value)] <- 6L
  } else {
    d$view_value <- d[[metric]]
  }
  d
}

dashboard_theme <- function() {
  ggplot2::theme_minimal(base_size = 12) +
    ggplot2::theme(
      plot.title = ggplot2::element_text(colour = "#173b68", face = "bold"),
      panel.grid.minor = ggplot2::element_blank(),
      legend.position = "bottom"
    )
}

product_table <- function(p) {
  result <- data.frame(
    Barcode = p$code,
    Product = product_name(p),
    `EUR per kg/L` = round(p$representative_price, 2),
    Nutrition = grade_label(p$nutri_grade),
    Environment = grade_label(p$environment_grade),
    `Regular offers` = p$n_valid_regular_offers,
    check.names = FALSE
  )
  units <- unique(p$target_unit)
  names(result)[3] <- if (length(units) == 1L) paste0("EUR/", units) else "EUR per unit"
  result
}

`%||%` <- function(x, y) {
  if (is.null(x) || length(x) == 0L || (is.character(x) && length(x) == 1L && !nzchar(x))) y else x
}

# Compatibility shim for older scripts that still call the ceiling filter.
filter_products <- function(p, category, budget, nutrition, environment, unknown = FALSE) {
  ng <- as.character(p$nutri_grade)
  eg <- as.character(p$environment_grade)
  keep <- p$category == category & p$representative_price <= budget &
    ((!is.na(ng) & ng %in% nutrition) | (unknown & is.na(ng))) &
    ((!is.na(eg) & eg %in% environment) | (unknown & is.na(eg)))
  d <- p[which(keep), , drop = FALSE]
  d[order(d$representative_price, d$code), , drop = FALSE]
}
