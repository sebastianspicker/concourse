/** Parses bounded ICS property parameters without trusting malformed metadata. */

const MAX_ICS_PARAMETERS_PER_PROPERTY = 64;

type ParsedIcsParams = {
  params: Record<string, string>;
  overflowed: boolean;
};

type ParameterSegment = {
  nextOffset: number;
  key?: string;
  value?: string;
};

/** Parses a bounded parameter list and reports overflow instead of accepting unbounded metadata. */
export function parseIcsParams(rawParams: string): ParsedIcsParams {
  const params: Record<string, string> = {};
  let offset = 0;
  let parameterCount = 0;
  while (offset < rawParams.length) {
    if (parameterCount >= MAX_ICS_PARAMETERS_PER_PROPERTY) return { params, overflowed: true };
    const segment = readParameterSegment(rawParams, offset);
    setTimeZoneParam(params, segment);
    parameterCount += 1;
    offset = segment.nextOffset;
  }
  return { params, overflowed: false };
}

function readParameterSegment(rawParams: string, offset: number): ParameterSegment {
  const separatorOffset = rawParams.indexOf(";", offset);
  const end = separatorOffset < 0 ? rawParams.length : separatorOffset;
  const equalsOffset = rawParams.indexOf("=", offset);
  if (equalsOffset < offset || equalsOffset >= end) return { nextOffset: end + 1 };
  return {
    nextOffset: end + 1,
    key: rawParams.slice(offset, equalsOffset),
    value: rawParams.slice(equalsOffset + 1, end)
  };
}

function setTimeZoneParam(params: Record<string, string>, segment: ParameterSegment): void {
  if (segment.key?.toUpperCase() !== "TZID" || !segment.value) return;
  params.TZID = segment.value.replace(/^"(.*)"$/, "$1");
}
