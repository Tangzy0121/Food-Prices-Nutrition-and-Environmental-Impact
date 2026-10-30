# Topic feasibility pilot. Run at the repository root: Rscript analysis/pilot.R
# All reported comparisons are descriptive, exploratory, and non-causal.
suppressPackageStartupMessages({
  library(dplyr)
  library(tidyr)
  library(readr)
  library(ggplot2)
  library(data.table)
  library(jsonlite)
})
options(dplyr.summarise.inform = FALSE)
raw <- "data/pilot/raw"
out <- "analysis/pilot-output"
dir.create(out, recursive = TRUE, showWarnings = FALSE)
csv_out <- function(x, name) write_csv(x, file.path(out, paste0(name, ".csv")))
dt <- function(x) as.POSIXct(x, format = "%Y-%m-%d %H:%M:%OS", tz = "UTC")
theme_set(theme_minimal(base_size = 12) + theme(
  panel.grid.minor = element_blank(), plot.title = element_text(face = "bold"),
  plot.title.position = "plot", plot.caption = element_text(hjust = 0),
  legend.position = "bottom", axis.title = element_text(size = 10)))
blue <- "#225bb6"
save_plot <- function(p, filename, width = 9, height = 4.6) {
  ggsave(file.path(out, filename), p, width = width, height = height, dpi = 160,
         device = grDevices::svg, bg = "white")
}

# 1. Olist: work at order grain; earliest submitted review as primary definition.
orders <- read_csv(file.path(raw, "olist_orders_dataset.csv"), show_col_types = FALSE)
reviews <- read_csv(file.path(raw, "olist_order_reviews_dataset.csv"), show_col_types = FALSE)
customers <- read_csv(file.path(raw, "olist_customers_dataset.csv"), show_col_types = FALSE)
stopifnot(!anyDuplicated(orders$order_id), !anyDuplicated(customers$customer_id))
rv <- reviews %>% arrange(order_id, review_answer_timestamp, review_id) %>%
  distinct(order_id, .keep_all = TRUE)
joined <- orders %>% left_join(rv, by = "order_id", relationship = "one-to-one") %>%
  left_join(customers %>% select(customer_id, customer_state), by = "customer_id",
            relationship = "many-to-one") %>%
  mutate(purchase_day = as.Date(order_purchase_timestamp),
         delivered_day = as.Date(order_delivered_customer_date),
         estimated_day = as.Date(order_estimated_delivery_date),
         actual_days = as.numeric(difftime(order_delivered_customer_date,
                                         order_purchase_timestamp, units = "days")),
         promised_days = as.numeric(estimated_day - purchase_day),
         overdue_days = as.numeric(delivered_day - estimated_day),
         late = overdue_days > 0,
         answered_after_delivery = review_answer_timestamp >= order_delivered_customer_date,
         low = review_score <= 2,
         purchase_month = format(purchase_day, "%Y-%m"))
eligible <- joined %>% filter(order_status == "delivered", !is.na(actual_days),
                              actual_days >= 0, !is.na(promised_days), promised_days >= 0,
                              !is.na(review_score))
e <- eligible %>% filter(answered_after_delivery %in% TRUE) %>% mutate(
  duration_band = cut(actual_days, c(0, 7, 14, 21, 30, Inf), right = FALSE,
                      labels = c("0-<7", "7-<14", "14-<21", "21-<30", "30+")),
  promise_band = cut(promised_days, c(0, 14, 21, 28, 35, Inf), right = FALSE,
                     labels = c("0-13", "14-20", "21-27", "28-34", "35+")))
olist_audit <- list(raw_orders = nrow(orders), raw_review_rows = nrow(reviews),
  distinct_review_orders = n_distinct(reviews$order_id),
  orders_with_multiple_reviews = sum(table(reviews$order_id) > 1),
  delivered = sum(orders$order_status == "delivered"),
  eligible_with_review = nrow(eligible),
  before_delivery_or_unknown_answer = sum(!(eligible$answered_after_delivery %in% TRUE)),
  final_reviewed_after_delivery = nrow(e), low_definition = "review_score <= 2",
  primary_review = "earliest submitted review per order",
  late_definition = "delivered calendar date > estimated calendar date")
olist_overall <- e %>% summarise(n=n(), on_time=mean(!late), median_actual=median(actual_days),
  median_promised=median(promised_days), low_rate=mean(low), score=mean(review_score))
olist_duration <- e %>% group_by(duration_band, late) %>% summarise(
  n=n(), low_n=sum(low), low_rate=mean(low), mean_score=mean(review_score))
olist_promise <- e %>% group_by(promise_band) %>% summarise(n=n(),
  median_actual=median(actual_days), median_promised=median(promised_days),
  on_time=mean(!late), low_rate=mean(low), score=mean(review_score))
olist_state <- e %>% group_by(customer_state) %>% summarise(n=n(),
  on_time=mean(!late), median_actual=median(actual_days),
  median_promised=median(promised_days), low_rate=mean(low), score=mean(review_score)) %>%
  filter(n >= 300) %>% mutate(punctuality_rank = min_rank(desc(on_time)),
                             speed_rank = min_rank(median_actual)) %>% arrange(desc(on_time))
olist_month <- e %>% filter(!late) %>% group_by(purchase_month) %>%
  summarise(n=n(), low_rate=mean(low), median_actual=median(actual_days))
olist_state_duration <- e %>% group_by(customer_state, duration_band, late) %>%
  summarise(n=n(), low_n=sum(low), low_rate=mean(low))
# Operational delivery metrics must not depend on whether/when a review exists.
delivery_all <- joined %>% filter(order_status=="delivered",!is.na(actual_days),
  actual_days>=0,!is.na(promised_days),promised_days>=0) %>% mutate(
    promise_band=cut(promised_days,c(0,14,21,28,35,Inf),right=FALSE,
      labels=c("0-13","14-20","21-27","28-34","35+")))
olist_delivery_promise <- delivery_all %>% group_by(promise_band) %>% summarise(
  n=n(),on_time=mean(!late),median_actual=median(actual_days),median_promised=median(promised_days))
olist_review_selection <- eligible %>% group_by(late) %>% summarise(
  n=n(),retained_after_delivery=sum(answered_after_delivery %in% TRUE),
  retain_rate=mean(answered_after_delivery %in% TRUE),low_all=mean(low),
  low_retained=mean(low[answered_after_delivery %in% TRUE]))
olist_review_timing <- eligible %>% mutate(
  timing=if_else(answered_after_delivery %in% TRUE,"At/after recorded delivery","Before recorded delivery"),
  days_answer_before_delivery=as.numeric(difftime(order_delivered_customer_date,
      review_answer_timestamp,units="days"))) %>% group_by(late,timing) %>%
  summarise(n=n(),low_n=sum(low),low_rate=mean(low),
    median_answer_before_delivery=median(days_answer_before_delivery,na.rm=TRUE),
    before_by_at_least_24h=sum(days_answer_before_delivery>=1,na.rm=TRUE))
# Review-selection sensitivity: latest review, and all eligible regardless answer timing.
rv_latest <- reviews %>% arrange(order_id, desc(review_answer_timestamp), review_id) %>%
  distinct(order_id, .keep_all=TRUE) %>% select(order_id, review_score, review_answer_timestamp)
e_latest <- orders %>% select(-any_of(c("review_score", "review_answer_timestamp"))) %>%
  left_join(rv_latest, by="order_id") %>% filter(order_status=="delivered",
    !is.na(order_delivered_customer_date), !is.na(order_estimated_delivery_date),
    order_delivered_customer_date >= order_purchase_timestamp,
    as.Date(order_estimated_delivery_date)>=as.Date(order_purchase_timestamp),
    review_answer_timestamp >= order_delivered_customer_date) %>% mutate(
      late=as.Date(order_delivered_customer_date)>as.Date(order_estimated_delivery_date),
      low=review_score<=2,
      duration_band=cut(as.numeric(difftime(order_delivered_customer_date,
                            order_purchase_timestamp,units="days")),
        c(0,7,14,21,30,Inf),right=FALSE,
        labels=c("0-<7","7-<14","14-<21","21-<30","30+")))
olist_sensitivity <- bind_rows(
  e %>% mutate(definition="earliest_after_delivery"),
  e_latest %>% mutate(definition="latest_after_delivery"),
  eligible %>% mutate(definition="earliest_all_answer_times",
    duration_band=cut(actual_days,c(0,7,14,21,30,Inf),right=FALSE,
      labels=c("0-<7","7-<14","14-<21","21-<30","30+")))) %>%
  group_by(definition,duration_band,late) %>% summarise(n=n(), low_rate=mean(low))
csv_out(olist_overall,"olist_overall");csv_out(olist_duration,"olist_duration")
csv_out(olist_promise,"olist_promise");csv_out(olist_state,"olist_state")
csv_out(olist_month,"olist_month");csv_out(olist_state_duration,"olist_state_duration")
csv_out(olist_sensitivity,"olist_sensitivity")
csv_out(olist_delivery_promise,"olist_delivery_promise_all_delivered")
csv_out(olist_review_selection,"olist_review_selection")
csv_out(olist_review_timing,"olist_review_timing")
p0 <- ggplot(olist_review_timing,aes(timing,low_rate,fill=factor(late)))+
  geom_col(position="dodge",width=.65)+
  geom_text(aes(label=paste0("n=",format(n,big.mark=",",scientific=FALSE))),
    position=position_dodge(width=.65),vjust=-.5,size=3)+
  scale_fill_manual(values=c("#555555",blue),labels=c("On time","Late"),name=NULL)+
  scale_y_continuous(labels=function(x)paste0(round(x*100),"%"),limits=c(0,1))+
  labs(title="Review timing changes which customer experiences are observed",x=NULL,
    y="Ratings of 1 or 2",caption="95,824 delivered orders with an eligible earliest review. Timing uses submitted-answer timestamps.\nThese are different orders; this chart does not estimate a change in the same customer's rating.")
save_plot(p0,"olist-review-timing.svg",height=4.9)
p1 <- ggplot(olist_duration %>% filter(n>=100),
  aes(duration_band,low_rate,colour=factor(late),group=factor(late)))+
  geom_line(linewidth=.7)+geom_point(aes(size=n),alpha=.8)+
  scale_colour_manual(values=c("FALSE"="#555555","TRUE"=blue),
    labels=c("On time","Late"),name=NULL)+scale_size_area(max_size=7,name="Orders")+
  scale_y_continuous(labels=function(x) paste0(round(x*100),"%"),limits=c(0,1))+
  labs(title="Low ratings by actual delivery duration",x="Actual delivery days",y="Ratings of 1 or 2",
       caption="Earliest submitted review; answer at/after delivery. Groups with at least 100 orders.")
save_plot(p1,"olist-duration.svg")
p2 <- ggplot(olist_state,aes(median_actual,on_time))+
  geom_point(aes(size=n),colour=blue,alpha=.75)+
  geom_text(aes(label=customer_state),nudge_y=.008,size=3,check_overlap=TRUE)+
  scale_size_area(max_size=10,name="Orders")+
  scale_y_continuous(labels=function(x)paste0(round(x*100),"%"))+
  labs(title="Do faster states always have better on-time rates?",x="Median actual delivery days",y="On-time rate",
       caption="States with at least 300 eligible reviewed orders; descriptive comparison, no case-mix adjustment.")
save_plot(p2,"olist-states.svg")
cat("OLIST COMPLETE\n")

# 2. Hotel: complete 2016 arrival cohort, explicit final-status definitions.
hotel <- read_csv(file.path(raw,"hotels.csv"),show_col_types=FALSE)
h <- hotel %>% mutate(arrival=as.Date(sprintf("%04d-%02d-%02d",arrival_date_year,
        match(arrival_date_month,month.name),arrival_date_day_of_month)),
     cancellation_days=as.numeric(arrival-reservation_status_date),
     canceled=reservation_status=="Canceled", no_show=reservation_status=="No-Show",
     stayed=reservation_status=="Check-Out", late_cancel=canceled & cancellation_days>=0 & cancellation_days<=7,
     month=format(arrival,"%Y-%m"))
h16 <- h %>% filter(arrival_date_year==2016)
hotel_audit <- list(raw_rows=nrow(hotel), exact_duplicate_rows=sum(duplicated(hotel)),
  rows_2016=nrow(h16), missing_arrival=sum(is.na(h$arrival)),
  canceled_negative_gap=sum(h$canceled & h$cancellation_days<0,na.rm=TRUE),
  status_cross_tab=as.data.frame(table(hotel$is_canceled,hotel$reservation_status)),
  duplicates_policy="Retain identical rows: no booking identifier to distinguish genuine repeated bookings",
  late_definition="Explicit Canceled status and cancellation 0-7 calendar days before arrival")
hotel_summary <- function(x, groups) x %>% group_by(across(all_of(groups))) %>% summarise(
  bookings=n(), canceled_n=sum(canceled), cancellation_rate=mean(canceled),
  no_show_n=sum(no_show), stayed_n=sum(stayed), stayed_rate=mean(stayed),
  late_cancel_n=sum(late_cancel), late_cancel_per_booking=mean(late_cancel),
  late_share_of_canceled=ifelse(sum(canceled)>0,sum(late_cancel)/sum(canceled),NA_real_),
  median_cancel_days=ifelse(sum(canceled)>0,median(cancellation_days[canceled]),NA_real_),
  median_lead_time=median(lead_time))
hotel_channel <- hotel_summary(h16,c("hotel","distribution_channel"))
hotel_segment <- hotel_summary(h16,c("hotel","market_segment"))
hotel_month <- hotel_summary(h16,c("hotel","distribution_channel","month"))
hotel_cancel_window <- h16 %>% filter(canceled, cancellation_days>=0) %>% mutate(
  window=cut(cancellation_days,c(-1,7,30,90,Inf),labels=c("0-7 days","8-30 days","31-90 days","91+ days"))) %>%
  count(hotel,distribution_channel,window) %>% group_by(hotel,distribution_channel) %>% mutate(share=n/sum(n))
hotel_year <- hotel_summary(h,c("arrival_date_year","hotel","distribution_channel"))
# Sensitivity only: exact-row dedup is not automatically a valid correction.
hotel_dedup <- hotel_summary(distinct(h16),c("hotel","distribution_channel"))
hotel_lead_bins <- hotel_summary(h16 %>% mutate(
  lead_band=cut(lead_time,c(-1,7,30,90,Inf),labels=c("0-7","8-30","31-90","91+"))),
  c("hotel","distribution_channel","lead_band"))
hotel_timing_thresholds <- bind_rows(lapply(c(3,7,14),function(days) {
  h16 %>% mutate(late_cancel=canceled & cancellation_days>=0 & cancellation_days<=days) %>%
    hotel_summary(c("hotel","distribution_channel")) %>% mutate(window_days=days)
}))
csv_out(hotel_channel,"hotel_channels_2016");csv_out(hotel_segment,"hotel_segments_2016")
csv_out(hotel_month,"hotel_months_2016");csv_out(hotel_cancel_window,"hotel_cancel_windows")
csv_out(hotel_year,"hotel_by_year");csv_out(hotel_dedup,"hotel_dedup_sensitivity")
csv_out(hotel_lead_bins,"hotel_lead_bins")
csv_out(hotel_timing_thresholds,"hotel_timing_thresholds")
plot_channel <- hotel_channel %>% filter(bookings>=300) %>%
  select(hotel,distribution_channel,cancellation_rate,late_share_of_canceled) %>%
  pivot_longer(c(cancellation_rate,late_share_of_canceled),names_to="metric",values_to="rate")
p3 <- ggplot(plot_channel,aes(distribution_channel,rate,fill=metric))+
  geom_col(position="dodge",width=.65)+facet_wrap(~hotel)+
  scale_fill_manual(values=c("#555555",blue),labels=c("Canceled / all bookings","0-7 days / canceled"),name=NULL)+
  scale_y_continuous(labels=function(x)paste0(round(x*100),"%"),limits=c(0,1))+
  labs(title="Cancellation frequency and timing tell different stories",x=NULL,y="Share",
    caption="2016 arrivals. Explicit Canceled status only; No-Show excluded from the canceled numerator.")
save_plot(p3,"hotel-channels.svg")
p4 <- ggplot(hotel_cancel_window %>% semi_join(hotel_channel %>% filter(bookings>=300),
      by=c("hotel","distribution_channel")),aes(distribution_channel,share,fill=window))+
  geom_col(width=.65)+facet_wrap(~hotel)+
  scale_fill_manual(values=c(blue,"#7289af","#b4becd","#e4e6e9"),name="Days before arrival")+
  scale_y_continuous(labels=function(x)paste0(round(x*100),"%"))+
  labs(title="When cancellations happen",x=NULL,y="Share of explicitly canceled bookings",
       caption="2016 arrivals. Booking-level data are not an inventory or realized-loss measure.")
save_plot(p4,"hotel-windows.svg")
cat("HOTEL COMPLETE\n")

# 3. Bike: complete official JC monthly archives (Jersey City and Hoboken).
read_bike <- function(file, month) {
  z <- unzip(file,list=TRUE)
  names <- z$Name[grepl("\\.csv$",z$Name)&!grepl("^__MACOSX",z$Name)]
  td <- tempfile("bike_extract_");dir.create(td)
  on.exit(unlink(td,recursive=TRUE),add=TRUE)
  paths <- unzip(file,files=names,exdir=td)
  as_tibble(rbindlist(lapply(paths,function(p)fread(p,colClasses="character")),fill=TRUE)) %>%
    mutate(source_month=month)
}
b_raw <- bind_rows(read_bike(file.path(raw,"bike_sep.zip"),"2024-09"),
                   read_bike(file.path(raw,"bike_oct.zip"),"2024-10"))
b <- b_raw %>% distinct(ride_id,.keep_all=TRUE) %>%
  mutate(start=dt(started_at),end=dt(ended_at),duration=as.numeric(difftime(end,start,units="secs")))
bad_time <- is.na(b$start)|is.na(b$end)|is.na(b$duration)|b$duration<60|b$duration>86400
bad_station <- is.na(b$start_station_id)|b$start_station_id==""|is.na(b$end_station_id)|b$end_station_id==""
b_ok <- b %>% filter(!bad_time,!bad_station)
events <- bind_rows(
  b_ok %>% transmute(station=start_station_id,name=start_station_name,time=start,flow="out"),
  b_ok %>% transmute(station=end_station_id,name=end_station_name,time=end,flow="in")) %>%
  filter(grepl("^(JC|HB)",station)) %>%
  mutate(date=as.Date(time,tz="UTC"),month=format(date,"%Y-%m"),
         hour=as.integer(format(time,"%H",tz="UTC")),
         weekday=as.POSIXlt(time,tz="UTC")$wday %in% 1:5) %>%
  filter(month %in% c("2024-09","2024-10"),
         as.integer(format(date,"%d"))!=1) # avoid missing inbound trips from previous month's file
station_names <- events %>% count(station,name) %>% arrange(station,desc(n),name) %>%
  distinct(station,.keep_all=TRUE) %>% select(station,name)
events_w <- events %>% filter(weekday)
hourly <- events_w %>% count(month,station,date,hour,flow) %>%
  pivot_wider(names_from=flow,values_from=n,values_fill=0) %>%
  mutate(activity=`in`+out,net=`in`-out,ratio=abs(net)/activity,
         strong_hour=activity>=20 & abs(net)>=10 & ratio>=.5)
daily <- hourly %>% group_by(month,station,date) %>% summarise(
  activity=sum(activity),net=sum(net),daily_ratio=abs(net)/activity,
  strong_hour=any(strong_hour),hourly_abs_net=sum(abs(net)),
  max_hour_net=max(abs(net))) %>% mutate(
    eligible=activity>=40,balanced=eligible & daily_ratio<=.1,
    masked=balanced & strong_hour)
bike_summary <- daily %>% group_by(month) %>% summarise(
  active_station_days=n(),eligible_station_days=sum(eligible),
  balanced_station_days=sum(balanced),masked_station_days=sum(masked),
  masked_share_of_balanced=sum(masked)/sum(balanced),
  stations_eligible=n_distinct(station[eligible]),
  stations_with_masked_day=n_distinct(station[masked]))
bike_stations <- daily %>% group_by(month,station) %>% summarise(
  active_days=n(),eligible_days=sum(eligible),balanced_days=sum(balanced),
  masked_days=sum(masked),activity=sum(activity),net=sum(net)) %>%
  mutate(month_ratio=abs(net)/activity) %>% left_join(station_names,by="station")
# Compare pre-specified morning and evening windows in both months.
periods <- events_w %>% mutate(period=case_when(hour %in% 7:9~"AM",hour %in% 17:19~"PM",TRUE~NA_character_)) %>%
  filter(!is.na(period)) %>% count(month,station,period,flow) %>%
  pivot_wider(names_from=flow,values_from=n,values_fill=0) %>% mutate(activity=`in`+out,net=`in`-out,ratio=net/activity)
bike_period <- periods %>% select(month,station,period,activity,net,ratio) %>%
  pivot_wider(names_from=period,values_from=c(activity,net,ratio)) %>%
  left_join(bike_stations,by=c("month","station")) %>% mutate(
    reversal=activity_AM>=100 & activity_PM>=100 & ratio_AM*ratio_PM<0 &
      abs(ratio_AM)>=.2 & abs(ratio_PM)>=.2)
bike_repeat <- bike_stations %>% filter(eligible_days>=10) %>% select(month,station,name,masked_days,balanced_days,eligible_days,month_ratio) %>%
  pivot_wider(names_from=month,values_from=c(masked_days,balanced_days,eligible_days,month_ratio)) %>%
  filter(!is.na(`eligible_days_2024-09`),!is.na(`eligible_days_2024-10`)) %>%
  arrange(desc(pmin(`masked_days_2024-09`,`masked_days_2024-10`)))
# Sensitivity across reasonable thresholds, rather than reporting one convenient cutoff.
bike_thresholds <- bind_rows(lapply(c(.05,.1,.15),function(balance_cut) {
  bind_rows(lapply(c(8,10,15),function(net_cut) {
    d <- hourly %>% group_by(month,station,date) %>% summarise(
       strong=any(activity>=20 & abs(net)>=net_cut & ratio>=.5),
       activity=sum(activity),net=sum(net)) %>%
       filter(activity>=40) %>% group_by(month) %>% summarise(
         eligible_days=n(),balanced_days=sum(abs(net)/activity<=balance_cut),
         masked_days=sum(abs(net)/activity<=balance_cut & strong))
    mutate(d,balance_cut=balance_cut,hour_net_cut=net_cut)
  }))
}))
bike_audit <- list(raw_trips=nrow(b_raw),duplicate_ride_ids=nrow(b_raw)-nrow(b),
  invalid_duration_or_time=sum(bad_time),missing_either_station=sum(bad_station),
  retained_trips=nrow(b_ok),local_events=nrow(events),
  month_rows=b_raw%>%count(source_month),
  primary_station_day="Calendar weekday, >=40 events; day abs(net)/activity <=0.10; strong hour >=20 events, abs(net)>=10 and abs(net)/activity>=0.50",
  scope="JC monthly files: Jersey City and Hoboken JC/HB station events. Month first day excluded.",
  time="Source local clock strings, parsed as UTC solely to preserve civil-hour arithmetic; no timezone conversion.")
csv_out(bike_summary,"bike_summary");csv_out(bike_stations,"bike_stations")
csv_out(bike_period,"bike_periods");csv_out(bike_repeat,"bike_repeated_stations")
csv_out(daily,"bike_station_days");csv_out(bike_thresholds,"bike_threshold_sensitivity")
csv_out(hourly,"bike_station_hours")
candidate <- bike_repeat %>% slice_head(n=1)
if(nrow(candidate)>0) {
  chosen <- candidate$station[1]
  curve <- events_w %>% filter(station==chosen) %>% count(month,hour,flow) %>%
    complete(month,hour=0:23,flow=c("in","out"),fill=list(n=0)) %>%
    pivot_wider(names_from=flow,values_from=n,values_fill=0) %>% mutate(net=`in`-out)
  csv_out(curve,"bike_example_hourly")
  p5 <- ggplot(curve,aes(hour,net,fill=net>0))+geom_col(width=.8)+facet_wrap(~month,ncol=1)+
    geom_hline(yintercept=0,linewidth=.4)+scale_fill_manual(values=c("#555555",blue),guide="none")+
    scale_x_continuous(breaks=seq(0,23,3))+
    labs(title=paste0(candidate$name[1]," (",chosen,"): weekday hourly net flow"),
      x="Local hour",y="Arrivals minus departures",
      caption="Aggregated weekdays; first day of each month excluded. Positive = net arrivals.\nExample selected for repeated masked days in both months, not a representative station.")
  save_plot(p5,"bike-example.svg",height=6)
}
p6 <- ggplot(bike_period %>% filter(!is.na(ratio_AM),!is.na(ratio_PM),activity_AM>=100,activity_PM>=100),
       aes(ratio_AM,ratio_PM))+
  geom_hline(yintercept=0,colour="#aaaaaa")+geom_vline(xintercept=0,colour="#aaaaaa")+
  geom_point(aes(size=activity,colour=reversal),alpha=.7)+facet_wrap(~month)+
  scale_colour_manual(values=c("#777777",blue),name="Strong reversal")+
  scale_size_area(max_size=7,name="Events")+
  scale_x_continuous(labels=function(x)paste0(round(x*100),"%"),limits=c(-1,1))+
  scale_y_continuous(labels=function(x)paste0(round(x*100),"%"),limits=c(-1,1))+
  labs(title="Morning and evening flows can point in opposite directions",
    x="AM (07-09): signed net / events",y="PM (17-19): signed net / events",
    caption="At least 100 events per window. Strong reversal: opposite signs, each absolute ratio >=20%.")
save_plot(p6,"bike-reversals.svg")
cat("BIKE COMPLETE\n")

results <- list(olist=list(audit=olist_audit,overall=olist_overall,duration=olist_duration,
        promise=olist_promise,states=olist_state,all_delivery_promise=olist_delivery_promise,
        review_selection=olist_review_selection,review_timing=olist_review_timing),
  hotel=list(audit=hotel_audit,channels=hotel_channel,segments=hotel_segment),
  bike=list(audit=bike_audit,summary=bike_summary,
    reversal_summary=bike_period%>%group_by(month)%>%summarise(
      eligible_stations=sum(activity_AM>=100 & activity_PM>=100,na.rm=TRUE),
      reversed_stations=sum(reversal,na.rm=TRUE)),
    repeated_stations=head(bike_repeat,10)))
write_json(results,file.path(out,"results.json"),pretty=TRUE,auto_unbox=TRUE,na="null",digits=6)
writeLines(capture.output(sessionInfo()),file.path(out,"sessionInfo.txt"))
cat("ALL COMPLETE: ",out,"\n")
