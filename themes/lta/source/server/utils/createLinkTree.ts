export const createLinkTree = (links: any[]) => {
  const hashTable = Object.create(null)
  links.forEach((link) => (hashTable[link.id] = { ...link }))

  const linkTree: any[] = []
  links.forEach((link) => {
    if (link.parent_id && hashTable[link.parent_id]) {
      if (!hashTable[link.parent_id].links) {
        hashTable[link.parent_id].links = []
      }
      hashTable[link.parent_id].links.push(hashTable[link.id])
    } else {
      linkTree.push(hashTable[link.id])
    }
  })

  return linkTree
}
