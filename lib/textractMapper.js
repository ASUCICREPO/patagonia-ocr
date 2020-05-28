module.exports = (textractOutput) => {
  // map response to something more useful:
  // - keyValues: a list of key-value pairs and
  // - rawText: a string of the complete detected text


  // https://medium.com/@hatemalimam/extract-text-and-data-from-any-document-using-amazon-textract-in-node-js-9a72136c6e64
  const mapped = {
    keyValues: [],
    rawText: '',
  };

  const mapOfKeys = {};
  const mapOfVals = {};

  textractOutput.Blocks.forEach((block) => {

    switch (block.BlockType) {
      case 'LINE':
        mapped.rawText += `${block.Text}\n`;
        break;

      case 'KEY_VALUE_SET':
        console.log(block);
        if (block.EntityTypes.find((e) => e === 'KEY')) {
          mapOfKeys[block.Id] = block.Id;
        } else {
          mapOfVals[block.Id] = block.Id;
        }
        break;

      default:
    }
  });

  return mapped;
};
