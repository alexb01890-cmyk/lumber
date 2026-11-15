type CommissionPreview = {
  id: string;
  currencyCode: 'USD';
  commissionStatus: 'TBD' | 'CALCULATED';
  splitStatus: 'UNCONFIRMED' | 'TBD' | 'CALCULATED';
  expectedCommissionMicros: string | null;
  yourExpectedShareMicros: string | null;
  partnerPoolExpectedShareMicros: string | null;
};

export const previewCommissions = (
  payload: unknown,
): { previewOnly: true; records: CommissionPreview[] } => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('records' in payload) ||
    !Array.isArray(payload.records) ||
    payload.records.length > 500
  ) {
    throw new Error(
      'Provide records as an array of at most 500 commission inputs.',
    );
  }

  const records = payload.records.map((record: unknown): CommissionPreview => {
    if (typeof record !== 'object' || record === null) {
      throw new Error('Each commission input must be an object.');
    }

    const input = record as Record<string, unknown>;

    if (typeof input.id !== 'string' || input.id.trim().length === 0) {
      throw new Error('Each commission input needs an id.');
    }

    if (input.currencyCode !== 'USD') {
      throw new Error('Commission previews currently support USD only.');
    }

    if (
      typeof input.termsConfirmed !== 'boolean' ||
      typeof input.splitConfirmed !== 'boolean'
    ) {
      throw new Error(
        'termsConfirmed and splitConfirmed must be explicit booleans.',
      );
    }

    const parsePercent = (value: unknown, label: string): bigint | null => {
      if (value === null) {
        return null;
      }

      if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 100 ||
        !/^\d+(?:\.\d{1,4})?$/.test(String(value))
      ) {
        throw new Error(
          `${label} must be null or a percentage from 0 to 100 with at most four decimal places.`,
        );
      }

      const [whole, fraction = ''] = String(value).split('.');

      return BigInt(whole) * 10_000n + BigInt(fraction.padEnd(4, '0'));
    };

    const commissionRate = parsePercent(input.commissionRate, 'commissionRate');
    const yourSharePercent = parsePercent(
      input.yourSharePercent,
      'yourSharePercent',
    );
    let eligibleAmount: bigint | null = null;

    if (input.eligibleAmountMicros !== null) {
      if (
        typeof input.eligibleAmountMicros !== 'string' ||
        !/^\d{1,30}$/.test(input.eligibleAmountMicros)
      ) {
        throw new Error(
          'eligibleAmountMicros must be null or a nonnegative integer string of at most 30 digits.',
        );
      }

      eligibleAmount = BigInt(input.eligibleAmountMicros);
    }

    const preview: CommissionPreview = {
      id: input.id,
      currencyCode: 'USD',
      commissionStatus: 'TBD',
      splitStatus: input.splitConfirmed ? 'TBD' : 'UNCONFIRMED',
      expectedCommissionMicros: null,
      yourExpectedShareMicros: null,
      partnerPoolExpectedShareMicros: null,
    };

    if (
      !input.termsConfirmed ||
      commissionRate === null ||
      eligibleAmount === null
    ) {
      return preview;
    }

    // Round once to cents without converting the money to floating-point numbers.
    const centsDenominator = 1_000_000n * 10_000n;
    const expectedCommission =
      ((eligibleAmount * commissionRate + centsDenominator / 2n) /
        centsDenominator) *
      10_000n;

    preview.commissionStatus = 'CALCULATED';
    preview.expectedCommissionMicros = expectedCommission.toString();

    if (!input.splitConfirmed || yourSharePercent === null) {
      return preview;
    }

    const yourShare =
      ((expectedCommission * yourSharePercent + centsDenominator / 2n) /
        centsDenominator) *
      10_000n;

    preview.splitStatus = 'CALCULATED';
    preview.yourExpectedShareMicros = yourShare.toString();
    preview.partnerPoolExpectedShareMicros = (
      expectedCommission - yourShare
    ).toString();

    return preview;
  });

  return { previewOnly: true, records };
};
