type ReorderPreview = {
  id: string;
  nextNeedDate: string;
  reviewDate: string;
  followingNeedDate: string;
};

export const previewReorders = (
  payload: unknown,
): { previewOnly: true; records: ReorderPreview[] } => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('records' in payload) ||
    !Array.isArray(payload.records) ||
    payload.records.length > 500
  ) {
    throw new Error(
      'Provide records as an array of at most 500 reorder inputs.',
    );
  }

  const records = payload.records.map((record: unknown): ReorderPreview => {
    if (typeof record !== 'object' || record === null) {
      throw new Error('Each reorder input must be an object.');
    }

    const input = record as Record<string, unknown>;

    if (typeof input.id !== 'string' || input.id.trim().length === 0) {
      throw new Error('Each reorder input needs an id.');
    }

    if (
      typeof input.nextNeedDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.nextNeedDate)
    ) {
      throw new Error('nextNeedDate must be a valid YYYY-MM-DD date.');
    }

    const needDate = new Date(`${input.nextNeedDate}T00:00:00.000Z`);

    if (
      !Number.isFinite(needDate.getTime()) ||
      needDate.toISOString().slice(0, 10) !== input.nextNeedDate
    ) {
      throw new Error('nextNeedDate must be a valid YYYY-MM-DD date.');
    }

    const repeatMonths = input.repeatMonths;
    const leadTimeDays = input.leadTimeDays;
    const reviewBufferDays = input.reviewBufferDays;

    if (
      typeof repeatMonths !== 'number' ||
      !Number.isSafeInteger(repeatMonths) ||
      repeatMonths <= 0
    ) {
      throw new Error('repeatMonths must be a positive whole number.');
    }

    if (
      typeof leadTimeDays !== 'number' ||
      !Number.isSafeInteger(leadTimeDays) ||
      leadTimeDays < 0 ||
      typeof reviewBufferDays !== 'number' ||
      !Number.isSafeInteger(reviewBufferDays) ||
      reviewBufferDays < 0
    ) {
      throw new Error(
        'leadTimeDays and reviewBufferDays must be nonnegative whole numbers.',
      );
    }

    const reviewDate = new Date(needDate);

    reviewDate.setUTCDate(
      needDate.getUTCDate() - leadTimeDays - reviewBufferDays,
    );

    const followingNeedDate = new Date(needDate);

    // Set the day last so January 31 clamps to February instead of rolling into March.
    followingNeedDate.setUTCDate(1);
    followingNeedDate.setUTCMonth(
      followingNeedDate.getUTCMonth() + repeatMonths,
    );

    const monthEnd = new Date(followingNeedDate);

    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    monthEnd.setUTCDate(0);
    followingNeedDate.setUTCDate(
      Math.min(needDate.getUTCDate(), monthEnd.getUTCDate()),
    );

    if (
      !Number.isFinite(reviewDate.getTime()) ||
      !Number.isFinite(followingNeedDate.getTime()) ||
      reviewDate.getUTCFullYear() < 1000 ||
      followingNeedDate.getUTCFullYear() > 9999
    ) {
      throw new Error(
        'The reorder interval or lead time is outside the supported date range.',
      );
    }

    return {
      id: input.id,
      nextNeedDate: input.nextNeedDate,
      reviewDate: reviewDate.toISOString().slice(0, 10),
      followingNeedDate: followingNeedDate.toISOString().slice(0, 10),
    };
  });

  return { previewOnly: true, records };
};
