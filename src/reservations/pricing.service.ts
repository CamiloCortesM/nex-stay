import { Injectable } from '@nestjs/common';

interface PricingParams {
  checkIn: Date;
  checkOut: Date;
  people: number;
  basePrice: number;
  allInclusive: boolean;
}

interface PricingResult {
  totalPrice: number;
  totalNights: number;
  weekendSurcharge?: number;
  discount?: number;
  allInclusiveCost?: number;
  basePrice?: number;
}

@Injectable()
export class PricingService {
  calculateTotalPrice(params: PricingParams): PricingResult {
    const { checkIn, checkOut, allInclusive, basePrice, people } = params;

    const totalNights = this.calculateNightOrDaysCount(checkIn, checkOut);
    const weekendNights = this.countWeekendNights(checkIn, totalNights);

    const baseTotal = basePrice * totalNights;
    const weekendSurcharge = basePrice * 0.2 * weekendNights;
    const discount = this.calculateDiscount(totalNights) * totalNights;
    const allInclusiveCost = this.calculateAllInclusiveCost(
      allInclusive,
      people,
      totalNights,
    );

    return {
      totalPrice: baseTotal + weekendSurcharge - discount + allInclusiveCost,
      totalNights,
      weekendSurcharge,
      discount,
      allInclusiveCost,
      basePrice,
    };
  }

  calculateNightOrDaysCount(checkIn: Date, checkOut: Date): number {
    const utcCheckIn = Date.UTC(
      checkIn.getFullYear(),
      checkIn.getMonth(),
      checkIn.getDate(),
    );

    const utcCheckOut = Date.UTC(
      checkOut.getFullYear(),
      checkOut.getMonth(),
      checkOut.getDate(),
    );

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((utcCheckOut - utcCheckIn) / millisecondsPerDay);
  }

  countWeekendNights(start: Date, nights: number): number {
    let weekendNights = 0;

    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate() + i,
        ),
      );

      const day = currentDate.getUTCDay();
      // Friday (5) or Saturday (6)
      if (day === 5 || day === 6) {
        weekendNights++;
      }
    }

    return weekendNights;
  }

  calculateDiscount(nights: number): number {
    if (nights >= 10) return 30000;
    if (nights >= 7) return 20000;
    if (nights >= 4) return 10000;
    return 0;
  }

  calculateAllInclusiveCost(
    isAllInclusive: boolean,
    peopleCount: number,
    nightCount: number,
  ): number {
    const allInclusivePricePerPersonPerNight = 25000;
    return isAllInclusive
      ? allInclusivePricePerPersonPerNight * peopleCount * nightCount
      : 0;
  }
}
