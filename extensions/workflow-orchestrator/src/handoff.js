function extractJsonBlocks(markdown) {
  const blocks = [];
  const regex = /```json\s*\n([\s\S]*?)\n```/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({
      jsonText: match[1],
      start: match.index,
      end: regex.lastIndex,
      prefix: markdown.slice(Math.max(0, match.index - 80), match.index),
    });
  }
  return blocks;
}

function looksLikeHandoff(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.workflow_mode === 'string' &&
      typeof value.current_skill === 'string' &&
      typeof value.next_skill === 'string' &&
      typeof value.requires_user === 'boolean' &&
      Object.prototype.hasOwnProperty.call(value, 'stop_reason') &&
      typeof value.confidence === 'string' &&
      value.inputs &&
      typeof value.inputs === 'object'
  );
}

function parseJsonBlock(block) {
  try {
    return { ok: true, value: JSON.parse(block.jsonText), block };
  } catch (error) {
    return { ok: false, error, block };
  }
}

function extractLatestHandoff(markdown) {
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    return { ok: false, reason: 'No markdown content provided' };
  }

  const blocks = extractJsonBlocks(markdown);
  if (blocks.length === 0) {
    return { ok: false, reason: 'No fenced JSON blocks found' };
  }

  const parsed = blocks.map(parseJsonBlock);
  const malformedAutoHandoff = parsed
    .filter((item) => !item.ok)
    .find((item) => /auto handoff:\s*$/i.test(item.block.prefix.trim()));
  if (malformedAutoHandoff) {
    return { ok: false, reason: `Malformed Auto handoff JSON: ${malformedAutoHandoff.error.message}` };
  }

  const handoffs = parsed
    .filter((item) => item.ok && looksLikeHandoff(item.value))
    .map((item) => ({ value: item.value, block: item.block, isAutoHandoff: /auto handoff:\s*$/i.test(item.block.prefix.trim()) }));

  if (handoffs.length === 0) {
    return { ok: false, reason: 'No valid workflow handoff JSON found' };
  }

  const autoHandoffs = handoffs.filter((handoff) => handoff.isAutoHandoff);
  const selected = (autoHandoffs.length ? autoHandoffs : handoffs).at(-1);

  return {
    ok: true,
    handoff: selected.value,
    source: selected.isAutoHandoff ? 'auto-handoff' : 'json-block',
    start: selected.block.start,
    end: selected.block.end,
  };
}

module.exports = {
  extractJsonBlocks,
  extractLatestHandoff,
  looksLikeHandoff,
};
