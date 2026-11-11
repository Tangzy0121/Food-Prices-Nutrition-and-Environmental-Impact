# Report exhibits use the corrected analysis data for both language editions.
library(ggplot2)
library(dplyr)
library(tidyr)
p <- readRDS("data/processed/step4_v1_1/analysis_products.rds")
stopifnot(nrow(p) == 598L, sum(p$joint_grades_price) == 583L)
languages <- commandArgs(trailingOnly = TRUE)
if (!length(languages) || identical(languages, "both")) languages <- c("en", "zh")
stopifnot(all(languages %in% c("en", "zh")))

for (language in languages) {
  zh <- language == "zh"
  label <- function(en, cn) if (zh) cn else en
  font <- if (zh && .Platform$OS.type == "windows") "Microsoft YaHei" else if (zh) "Noto Sans CJK SC" else "sans"
  d <- p
  d$category_label <- factor(d$category, levels = c("biscuits", "breakfast_cereals", "dark_chocolates", "fruit_juices"),
    labels = if (zh) c("饼干 (EUR/kg)", "早餐谷物 (EUR/kg)", "黑巧克力 (EUR/kg)", "果汁 (EUR/L)") else
      c("Biscuits (EUR/kg)", "Breakfast cereals (EUR/kg)", "Dark chocolate (EUR/kg)", "Fruit juices (EUR/L)"))
  d$nutri_grade <- ordered(d$nutri_grade, levels = letters[1:5])
  d$environment_grade <- ordered(d$environment_grade, levels = c("a-plus", letters[1:6]))
  theme_set(theme_minimal(base_size = 12, base_family = font) + theme(
    plot.title = element_text(face = "bold", size = 16, colour = "#183B35"),
    panel.grid.minor = element_blank(), strip.text = element_text(face = "bold"),
    plot.caption = element_text(hjust = 0, size = 10), legend.position = "none"))
  price_axis <- label("Unit price (log scale)", "单位价格（对数坐标）")
  plots <- list()
  plots$price_nutrition <- ggplot(filter(d, !is.na(nutri_grade)), aes(nutri_grade, representative_price)) +
    geom_boxplot(fill = "#D4E5D9", outlier.shape = NA) +
    geom_point(alpha = .45, size = 1.4, colour = "#24594A", position = position_jitter(width = .12, height = 0, seed = 20261105)) +
    facet_wrap(~category_label, scales = "free_y") + scale_y_log10() + scale_x_discrete(labels = toupper) +
    labs(title = label("Price varies within nutrition grades", "同一营养等级内部，价格仍有差异"),
      x = label("Nutri-Score 2023 grade (A is better)", "Nutri-Score 2023 等级（A 更好）"), y = price_axis,
      caption = label("Dots: products. Boxes: middle 50%. Centre lines: medians.", "点表示商品，箱体表示中间 50%，箱内横线表示中位数。"))
  plots$price_environment <- ggplot(filter(d, !is.na(environment_grade)), aes(environment_grade, representative_price, fill = environment_grade)) +
    geom_boxplot(outlier.shape = NA) +
    geom_point(alpha = .45, size = 1.3, position = position_jitter(width = .12, height = 0, seed = 20261105)) +
    facet_wrap(~category_label, scales = "free_y") + scale_y_log10() +
    scale_fill_manual(values = c("a-plus" = "#145A32", a = "#32945A", b = "#8AB66B", c = "#D9BC60", d = "#D98247", e = "#B94A48", f = "#7E283B")) +
    scale_x_discrete(labels = c("a-plus" = "A+", setNames(LETTERS[1:6], letters[1:6]))) +
    labs(title = label("Price ranges within environmental grades", "不同环境等级中的价格范围"),
      x = label("Environmental grade (A+ is better)", "环境等级（A+ 更好）"), y = price_axis,
      caption = label("Dots: products. Boxes: middle 50%. Centre lines: medians.", "点表示商品，箱体表示中间 50%，箱内横线表示中位数。"))
  chocolate <- d %>% filter(category == "dark_chocolates") %>%
    select(representative_price, sugars_100g, saturated_fat_100g) %>%
    pivot_longer(-representative_price, names_to = "nutrient", values_to = "grams") %>%
    filter(is.finite(grams))
  stats <- chocolate %>% group_by(nutrient) %>% summarise(n = n(), rho = cor(representative_price, grams, method = "spearman"), .groups = "drop")
  panel_labels <- setNames(paste0(if (zh) c("饱和脂肪", "糖") else c("Saturated fat", "Sugar"),
    sprintf("\nn = %d, rho = %+.3f", stats$n, stats$rho)), stats$nutrient)
  chocolate$nutrient <- factor(chocolate$nutrient, levels = c("sugars_100g", "saturated_fat_100g"))
  plots$chocolate_composition <- ggplot(chocolate, aes(representative_price, grams)) +
    geom_point(alpha = .65, size = 2, colour = "#326C5B") + scale_x_log10() +
    facet_wrap(~nutrient, scales = "free_y", labeller = as_labeller(panel_labels)) +
    labs(title = label("Higher-priced chocolate has less sugar and more saturated fat", "较贵的黑巧克力往往糖更少，饱和脂肪更多"),
      x = label("Unit price (EUR/kg, log scale)", "单位价格（EUR/kg，对数坐标）"),
      y = label("Nutrient (g per 100 g)", "成分含量（g/100 g）"),
      caption = label("Each dot is one chocolate. Each panel uses complete values for that nutrient.", "每点是一款黑巧克力，每幅图使用该成分数值完整的商品。"))
  destination <- file.path("reports/generated/figures", language)
  dir.create(destination, recursive = TRUE, showWarnings = FALSE)
  for (name in names(plots)) ggsave(file.path(destination, paste0(name, ".png")), plots[[name]],
    width = 11, height = if (name == "chocolate_composition") 5 else 7, dpi = 160, bg = "white")
  message("PASS: report figures for ", language)
}
