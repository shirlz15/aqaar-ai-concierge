create table if not exists analytics_lead_daily (
  metric_date date not null,
  lead_stage text not null,
  lead_temperature text not null,
  lead_count integer not null default 0,
  avg_lead_score numeric(5,2) not null default 0,
  primary key(metric_date, lead_stage, lead_temperature)
);

create table if not exists analytics_project_interest (
  metric_date date not null,
  project_name text not null,
  impressions integer not null default 0,
  conversations integer not null default 0,
  qualified_leads integer not null default 0,
  hot_leads integer not null default 0,
  primary key(metric_date, project_name)
);

create table if not exists analytics_intent_daily (
  metric_date date not null,
  intent text not null,
  conversation_count integer not null default 0,
  lead_count integer not null default 0,
  conversion_rate numeric(5,2) not null default 0,
  primary key(metric_date, intent)
);

create table if not exists analytics_location_interest (
  metric_date date not null,
  location text not null,
  inquiry_count integer not null default 0,
  avg_budget numeric(12,2),
  hot_leads integer not null default 0,
  primary key(metric_date, location)
);

create table if not exists analytics_conversation_quality (
  metric_date date not null,
  avg_turns numeric(5,2) not null default 0,
  completed_qualification_count integer not null default 0,
  handoff_count integer not null default 0,
  fallback_count integer not null default 0,
  suspicious_activity_count integer not null default 0,
  primary key(metric_date)
);
