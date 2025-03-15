export interface PricingParams {
  checkIn: Date;
  checkOut: Date;
  people: number;
  basePrice: number;
  allInclusive: boolean;
}

export interface PricingResult {
  totalPrice: number;
  totalNights: number;
  weekendSurcharge?: number;
  discount?: number;
  allInclusiveCost?: number;
  basePrice?: number;
}
