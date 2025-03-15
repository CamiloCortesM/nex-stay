import { PricingService } from './pricing.service';
import { PricingParams } from './interfaces/pricing.interface';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  describe('calculateNightOrDaysCount', () => {
    it('should calculate 0 nights for same date', () => {
      const checkIn = new Date('2023-01-01');
      const checkOut = new Date('2023-01-01');
      expect(service.calculateNightOrDaysCount(checkIn, checkOut)).toBe(0);
    });

    it('should calculate 1 night for consecutive days', () => {
      const checkIn = new Date('2023-01-01');
      const checkOut = new Date('2023-01-02');
      expect(service.calculateNightOrDaysCount(checkIn, checkOut)).toBe(1);
    });

    it('should handle month changes', () => {
      const checkIn = new Date('2023-01-31');
      const checkOut = new Date('2023-02-02');
      expect(service.calculateNightOrDaysCount(checkIn, checkOut)).toBe(2);
    });
  });

  describe('countWeekendNights', () => {
    it('should count 2 weekend nights (Friday and Saturday)', () => {
      const start = new Date(Date.UTC(2023, 0, 6)); // 2023-01-06 (Friday)
      expect(service.countWeekendNights(start, 2)).toBe(2);
    });

    it('should count 2 weekend nights in 3 nights (Thursday to Sunday)', () => {
      const start = new Date(Date.UTC(2023, 0, 5)); // 2023-01-05 (Thursday)
      expect(service.countWeekendNights(start, 3)).toBe(2); // Friday and Saturday
    });

    it('should handle complete weeks', () => {
      const start = new Date(Date.UTC(2023, 0, 1)); // Sunday
      expect(service.countWeekendNights(start, 7)).toBe(2); // 2 weekends
    });
  });

  describe('calculateDiscount', () => {
    it('no discount for less than 4 nights', () => {
      expect(service.calculateDiscount(3)).toBe(0);
    });

    it('discount of 10,000 per night for 4-6 nights', () => {
      expect(service.calculateDiscount(4)).toBe(10000);
      expect(service.calculateDiscount(6)).toBe(10000);
    });

    it('discount of 20,000 per night for 7-9 nights', () => {
      expect(service.calculateDiscount(7)).toBe(20000);
      expect(service.calculateDiscount(9)).toBe(20000);
    });

    it('discount of 30,000 per night for 10+ nights', () => {
      expect(service.calculateDiscount(10)).toBe(30000);
      expect(service.calculateDiscount(15)).toBe(30000);
    });
  });

  describe('calculateAllInclusiveCost', () => {
    it('should return 0 when not all-inclusive', () => {
      expect(service.calculateAllInclusiveCost(false, 2, 5)).toBe(0);
    });

    it('should calculate cost correctly for 3 people and 5 nights', () => {
      expect(service.calculateAllInclusiveCost(true, 3, 5)).toBe(25000 * 3 * 5);
    });
  });

  describe('calculateTotalPrice', () => {
    const baseParams: PricingParams = {
      checkIn: new Date('2023-01-02'), // Monday
      checkOut: new Date('2023-01-07'), // Saturday (5 nights)
      basePrice: 100000,
      people: 2,
      allInclusive: true,
    };

    it('should calculate individual components correctly', () => {
      const result = service.calculateTotalPrice(baseParams);

      expect(result.totalNights).toBe(5);
      expect(result.weekendSurcharge).toBe(100000 * 0.2 * 1); // 1 weekend night
      expect(result.discount).toBe(10000 * 5); // 5 nights with 10k discount
      expect(result.allInclusiveCost).toBe(25000 * 2 * 5);
    });

    it('should sum all components correctly', () => {
      const expectedTotal =
        100000 * 5 + // base
        100000 * 0.2 * 1 + // surcharge
        25000 * 2 * 5 - // all inclusive
        10000 * 5; // discount

      expect(service.calculateTotalPrice(baseParams).totalPrice).toBe(
        expectedTotal,
      );
    });

    it('should handle different complex scenarios', () => {
      const params: PricingParams = {
        checkIn: new Date('2023-01-01'),
        checkOut: new Date('2023-01-11'), // 10 nights
        basePrice: 150000,
        people: 4,
        allInclusive: false,
      };

      const result = service.calculateTotalPrice(params);

      // Verify maximum discount
      expect(result.discount).toBe(30000 * 10);

      // Verify all-inclusive disabled
      expect(result.allInclusiveCost).toBe(0);

      // Verify total calculation
      const expected =
        150000 * 10 +
        150000 * 0.2 * service.countWeekendNights(params.checkIn, 10) -
        30000 * 10;

      expect(result.totalPrice).toBe(expected);
    });
  });
});
