export const getRow = (index, cols) => Math.floor(index / cols);
export const getCol = (index, cols) => index % cols;

export const getEdgeKey = (from, to) => `${Math.min(from, to)}-${Math.max(from, to)}`;

export const getNeighbors = (node, rows, cols) => {
    const neighbors = [];
    const row = getRow(node, cols);
    const col = getCol(node, cols);
    
    if (row > 0) neighbors.push(node - cols);
    if (row < rows - 1) neighbors.push(node + cols);
    if (col > 0) neighbors.push(node - 1);
    if (col < cols - 1) neighbors.push(node + 1);
    
    return neighbors;
};

export const shuffleArray = (array, rng = Math.random) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const getNeighborDegree = (node, visitedArr, rows, cols) => {
    const neighbors = getNeighbors(node, rows, cols);
    return neighbors.filter(n => !visitedArr[n]).length;
};

export const sortByDegree = (node, visitedArr, rows, cols) => {
    const neighbors = getNeighbors(node, rows, cols).filter(n => !visitedArr[n]);
    neighbors.sort((a, b) => getNeighborDegree(a, visitedArr, rows, cols) - getNeighborDegree(b, visitedArr, rows, cols));
    
    for (let i = neighbors.length - 1; i > 0; i--) {
        if (getNeighborDegree(neighbors[i], visitedArr, rows, cols) === getNeighborDegree(neighbors[i-1], visitedArr, rows, cols)) {
            const j = Math.floor(Math.random() * (i + 1));
            [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
        }
    }
    return neighbors;
};