const getExtracted = (node, blocks) => {
  let text = '';

  if (Object.hasOwnProperty.call(node, 'Relationships')) {
    node.Relationships.forEach((relationship) => {
      if (relationship.Type === 'CHILD') {
        relationship.Ids.forEach((childId) => {
          const word = blocks[childId];
          if (word.BlockType === 'WORD') {
            text += `${word.Text} `;
          }
          if (word.BlockType === 'SELECTION_ELEMENT') {
            if (word.SelectionStatus === 'SELECTED') {
              text += 'X ';
            }
          }
        });
      }
    });
  }

  return text.trim();
};

const getBlock = (node, values) => {
  let valueBlock;
  node.Relationships.forEach((relationship) => {
    if (relationship.Type === 'VALUE') {
      relationship.Ids.every((valueId) => {
        if (Object.hasOwnProperty.call(values, valueId)) {
          valueBlock = values[valueId];
          return false;
        }
        return true;
      });
    }
  });

  return valueBlock;
};

const relateValue = (keys, values, blocks) => {
  const keyValues = {};

  const keyMapValues = Object.values(keys);

  keyMapValues.forEach((keyMapValue) => {
    const valueBlock = getBlock(keyMapValue, values);
    const key = getExtracted(keyMapValue, blocks);
    const value = getExtracted(valueBlock, blocks);
    keyValues[key] = value;
  });

  return keyValues;
};

const getMap = (blocksMap) => {
  const keys = {};
  const values = {};
  const blocks = {};

  let blockId;
  blocksMap.forEach((block) => {
    blockId = block.Id;
    blocks[blockId] = block;

    if (block.BlockType === 'KEY_VALUE_SET') {
      if (block.EntityTypes.includes('KEY')) {
        keys[blockId] = block;
      } else {
        values[blockId] = block;
      }
    }
  });

  return { keys, values, blocks };
};

module.exports = (textractOutput) => {
  const mapped = {
    keyValues: {},
    rawText: [],
  };

  textractOutput.Blocks
    .filter((block) => block.BlockType === 'LINE')
    .forEach((block) => mapped.rawText.push(`${block.Text}`));

  const { keys, values, blocks } = getMap(textractOutput.Blocks);
  mapped.keyValues = relateValue(keys, values, blocks);

  return mapped;
};
