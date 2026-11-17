export type CommissionRecord = {
  id: string;
  status?: string | null;
  commissionRate?: number | null;
  eligibleBasis?: string | null;
  eligibleAmount?: {
    amountMicros?: number | string | null;
    currencyCode?: string | null;
  } | null;
  expectedCommission?: {
    amountMicros?: number | string | null;
    currencyCode?: string | null;
  } | null;
  yourSharePercent?: number | null;
  partnerPoolSharePercent?: number | null;
  splitConfirmed?: boolean | null;
  splitTerms?: string | null;
  yourExpectedShare?: {
    amountMicros?: number | string | null;
    currencyCode?: string | null;
  } | null;
  partnerPoolExpectedShare?: {
    amountMicros?: number | string | null;
    currencyCode?: string | null;
  } | null;
};
