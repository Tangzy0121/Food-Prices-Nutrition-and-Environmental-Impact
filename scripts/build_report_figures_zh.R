# Chinese labels for the same three executed report exhibits; no analytical changes.
library(ggplot2)
library(dplyr)
if (.Platform$OS.type == "windows") invisible(Sys.setlocale("LC_CTYPE", "English_United States.UTF-8"))
p <- readRDS("outputs/step4/analysis_products.rds")
stopifnot(nrow(p) == 598L, sum(p$joint_grades_price) == 583L)
levels(p$category_label) <- c("饼干 (EUR/kg)", "早餐谷物 (EUR/kg)", "黑巧克力 (EUR/kg)", "果汁 (EUR/L)")
font <- if (.Platform$OS.type == "windows") "Microsoft YaHei" else "sans"
  palette_env <- c("a-plus" = "#145A32", a = "#32945A", b = "#8AB66B", c = "#D9BC60", d = "#D98247", e = "#B94A48", f = "#7E283B")
  theme_set(theme_minimal(base_size = 11, base_family = font) + theme(
    plot.title = element_text(face = "bold", size = 16, colour = "#183B35"), plot.subtitle = element_text(size = 11),
    panel.grid.minor = element_blank(), strip.text = element_text(face = "bold", colour = "#183B35"),
    plot.caption = element_text(hjust = 0, size = 9, colour = "#5D6864"), legend.position = "bottom"))
plots <- list()
  plots$`03_price_nutrition` <- ggplot(filter(p, !is.na(nutri_grade)), aes(nutri_grade, representative_price)) +
    geom_boxplot(fill = "#D4E5D9", outlier.shape = NA) + geom_point(alpha = .45, size = 1.3,
      position = position_jitter(width = .12, height = 0, seed = 20261105), colour = "#24594A") +
    facet_wrap(~category_label, scales = "free_y") + scale_y_log10() +
    labs(title = "更高价格是否对应更好的营养等级？", x = "Nutri-Score 2023 等级（A 更好）",
      y = "代表单位价格（对数坐标）", caption = "每点代表一款商品；注意样本稀少的等级组；等级缺失仅在本图排除。")
  plots$`04_price_sugars` <- ggplot(filter(p, is.finite(sugars_100g)), aes(representative_price, sugars_100g)) +
    geom_point(alpha = .6, size = 1.6, colour = "#326C5B") + scale_x_log10() + facet_wrap(~category_label, scales = "free") +
    labs(title = "价格与糖含量有何关系？", x = "代表单位价格（对数坐标）",
      y = "糖（g/100 g；果汁为 g/100 ml）", caption = "类别内的描述性比较，不作因果或临床解释。")
  plots$`05_price_environment` <- ggplot(filter(p, !is.na(environment_grade)), aes(environment_grade, representative_price, fill = environment_grade)) +
    geom_boxplot(outlier.shape = NA) + geom_point(alpha = .45, size = 1.2,
      position = position_jitter(width = .12, height = 0, seed = 20261105)) +
    scale_fill_manual(values = palette_env, guide = "none") + scale_y_log10() + facet_wrap(~category_label, scales = "free_y") +
    scale_x_discrete(labels = c("a-plus" = "A+", a = "A", b = "B", c = "C", d = "D", e = "E", f = "F")) +
    labs(title = "不同环境等级的价格有何差异？", x = "环境等级（A+ 更好）",
      y = "代表单位价格（对数坐标）", caption = "综合环境等级与碳估算分别分析。")

dir.create("outputs/step4/figures/zh", recursive = TRUE, showWarnings = FALSE)
for (name in names(plots)) ggsave(file.path("outputs/step4/figures/zh", paste0(name, ".png")), plots[[name]], width = 11, height = 7, dpi = 160, bg = "white")
