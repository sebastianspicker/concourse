/** Scans and unfolds ICS lines while enforcing a logical-line size limit. */

const CR = "\r";
const LF = "\n";
const SPACE = " ";
const TAB = "\t";
export const MAX_ICS_LOGICAL_LINE_LENGTH = 64 * 1024;

export type ScannedIcsLine = {
  value: string;
  oversized: boolean;
};

/** Yields unfolded logical ICS lines while rejecting lines beyond the byte budget. */
export function* scanUnfoldedLines(input: string): Generator<ScannedIcsLine> {
  let offset = 0;
  let logicalLine = "";
  let hasLogicalLine = false;
  let oversized = false;

  while (offset < input.length) {
    const physicalEnd = findPhysicalLineEnd(input, offset);
    const physicalLine = input.slice(offset, physicalEnd);
    offset = nextLineOffset(input, physicalEnd);

    if (isContinuation(physicalLine)) {
      const unfoldedLength = physicalLine.length - 1;
      if (canAppendFoldedLine(oversized, logicalLine.length, unfoldedLength)) {
        logicalLine += physicalLine.slice(1);
      } else {
        oversized = true;
      }
    } else {
      if (hasLogicalLine) yield { value: logicalLine, oversized };
      oversized = physicalLine.length > MAX_ICS_LOGICAL_LINE_LENGTH;
      logicalLine = oversized ? "" : physicalLine;
      hasLogicalLine = true;
    }
  }
  if (hasLogicalLine) yield { value: logicalLine, oversized };
}

function isContinuation(line: string): boolean {
  return line[0] === SPACE || line[0] === TAB;
}

function canAppendFoldedLine(oversized: boolean, currentLength: number, unfoldedLength: number): boolean {
  return !oversized && currentLength + unfoldedLength <= MAX_ICS_LOGICAL_LINE_LENGTH;
}

function findPhysicalLineEnd(input: string, offset: number): number {
  let lineEnd = offset;
  while (lineEnd < input.length) {
    const character = input[lineEnd];
    if (character === CR || character === LF) return lineEnd;
    lineEnd += 1;
  }
  return lineEnd;
}

function nextLineOffset(input: string, lineEnd: number): number {
  if (input[lineEnd] !== CR) return lineEnd + 1;
  return input[lineEnd + 1] === LF ? lineEnd + 2 : lineEnd + 1;
}
