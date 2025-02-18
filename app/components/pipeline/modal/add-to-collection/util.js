export const getCollectionsWithoutPipeline = (collections, pipelineId) => {
  const collectionsWithoutPipeline = [];

  collections.forEach(collection => {
    if (!collection.pipelineIds.includes(pipelineId)) {
      collectionsWithoutPipeline.push(collection);
    }
  });

  collectionsWithoutPipeline.sort((a, b) => a.name.localeCompare(b.name));

  return collectionsWithoutPipeline;
};

export const createCollectionBody = (
  collectionName,
  collectionDescription,
  pipelineId
) => {
  return {
    name: collectionName,
    description: collectionDescription,
    pipelineIds: [pipelineId],
    type: 'normal'
  };
};
