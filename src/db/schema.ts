import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const districts = sqliteTable('districts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  stateName: text('state_name').notNull(),
  districtName: text('district_name').notNull(),
  districtNameHindi: text('district_name_hindi'),
  districtCode: text('district_code').notNull().unique(),
  createdAt: text('created_at').notNull(),
});

export const performanceData = sqliteTable('performance_data', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  districtId: integer('district_id').references(() => districts.id).notNull(),
  finYear: text('fin_year').notNull(),
  month: text('month').notNull(),
  rawData: text('raw_data', { mode: 'json' }),
  metricWorkStatus: text('metric_work_status'),
  metricPaymentStatus: text('metric_payment_status'),
  metricTrend: text('metric_trend'),
  metricComparison: text('metric_comparison'),
  activeWorkers: integer('active_workers'),
  completedWorks: integer('completed_works'),
  avgPayment: integer('avg_payment'),
  paymentDelayed: integer('payment_delayed'),
  budgetUtilization: integer('budget_utilization'),
  monthlyTrend: integer('monthly_trend'),
  stateAverage: integer('state_average'),
  approvedLabourBudget: integer('approved_labour_budget'),
  avgWageRate: integer('avg_wage_rate'),
  avgDaysEmployment: integer('avg_days_employment'),
  totalHouseholdsWorked: integer('total_households_worked'),
  womenPersondays: integer('women_persondays'),
  totalExpenditure: integer('total_expenditure'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});