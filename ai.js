const node = [19,27,1,8,26,11,11,25,26,26,0,8,16,24,25,25,11,11,11,11,-1,-1,24,24,1,2,3,1,3,8,1,2,16,24,24,2,0,8,3,-1,-1,-1,1,3,-1,1,0,8,0,24,2,1,-1,-1,-1,-1,3,8,8,8];
let changed_node = [...node];
let white_node = 1;

const louds_data_string = '101010111010101010101111010101010101010101010111011010101010101010101000101010101010101010101010101001001010100101010100000';
const louds_data = louds_data_string.split('').map(c => parseInt(c));

function resetAIState() {
    changed_node = [...node];
    white_node = 1;
}

function getAIState() {
    return {
        changed_node: [...changed_node],
        white_node: white_node
    };
}

function setAIState(state) {
    changed_node = [...state.changed_node];
    white_node = state.white_node;
}

function select_0(louds_data, n) {
    for (let pos = 0; pos < louds_data.length; pos++) {
        if (louds_data[pos] === 0) {
            n -= 1;
            if (n === 0) {
                return pos + 1;
            }
        }
    }
    return -1;
}

function select_1(louds_data, n) {
    for (let pos = 0; pos < louds_data.length; pos++) {
        if (louds_data[pos] === 1) {
            n -= 1;
            if (n === 0) {
                return pos + 1;
            }
        }
    }
    return -1;
}

function rank_0(louds_data, k) {
    let count = 0;
    for (let i = k; i >= 0; i--) {
        if (i < louds_data.length && louds_data[i] === 0) {
            count++;
        }
    }
    return count;
}

function rank_1(louds_data, k) {
    let count = 0;
    for (let i = k; i >= 0; i--) {
        if (i < louds_data.length && louds_data[i] === 1) {
            count++;
        }
    }
    return count;
}

function find_children_index(louds_data, white_node) {
    const children_index = [];
    const index_0 = select_0(louds_data, white_node);
    
    if (index_0 === -1 || index_0 >= louds_data.length) {
        return [];
    }
    
    if (louds_data[index_0] === 0) {
        return [];
    }

    let i = 0;
    while (index_0 + i < louds_data.length && louds_data[index_0 + i] === 1) {
        children_index.push(index_0 + i);
        i++;
    }

    return children_index;
}

function find_children_node(louds_data, children_index) {
    const children_node = [];
    if (children_index.length === 0) {
        return [];
    }
    
    for (let i = 0; i < children_index.length; i++) {
        children_node.push(rank_1(louds_data, children_index[i]));
    }
    return children_node;
}

function find_black_node(children_node, place) {
    for (let i = 0; i < children_node.length; i++) {
        const nodeIndex = children_node[i] - 2;
        if (changed_node.length > nodeIndex && nodeIndex >= 0 && 
            changed_node[nodeIndex] === place) {
            return children_node[i];
        }
    }
    return -1;
}

function next_white_node(louds_data, black_node) {
    const select0Result = select_0(louds_data, black_node);
    if (select0Result === -1) {
        return -1;
    }
    return rank_1(louds_data, select0Result);
}

function onigiri_move(white_node, place) {
    try {
        const children_index = find_children_index(louds_data, white_node);
        const children_node = find_children_node(louds_data, children_index);
        
        if (children_node.length === 0) {
            return { cy: -1, cx: -1, next_node: -1 };
        }
        
        const firstChildIndex = children_node[0] - 2;
        let black_node;
        
        if (changed_node.length > firstChildIndex && firstChildIndex >= 0 &&
            changed_node[firstChildIndex] === -1) {
            black_node = children_node[0];
        } else {
            black_node = find_black_node(children_node, place);
            
            if (black_node === -1) {
                return { cy: -1, cx: -1, next_node: -1 };
            }
        }
        
        const next_node = next_white_node(louds_data, black_node);
        
        if (next_node === -1) {
            return { cy: -1, cx: -1, next_node: -1 };
        }
        
        const nextNodeIndex = next_node - 2;
        
        if (!(changed_node.length > nextNodeIndex && nextNodeIndex >= 0)) {
            return { cy: -1, cx: -1, next_node: -1 };
        }
        
        const targetPosition = changed_node[nextNodeIndex];
        
        if (targetPosition < 0 || targetPosition >= 16) {
            return { cy: -1, cx: -1, next_node: -1 };
        }
        
        const cy = Math.floor(targetPosition / 4);
        const cx = targetPosition % 4;
        
        return { 
            cy: cy, 
            cx: cx, 
            next_node: next_node
        };
        
    } catch (error) {
        return { cy: -1, cx: -1, next_node: -1 };
    }
}

function applyNodeTransformation(move) {
    if (white_node === 1) {
        if (move === 11) {
            for (let i = 0; i < changed_node.length; i++) {
                if (7 < changed_node[i] && changed_node[i] < 12) {
                    changed_node[i] = changed_node[i] - 4;
                } else if (15 < changed_node[i] && changed_node[i] < 20) {
                    changed_node[i] = changed_node[i] - 8;
                } else if (23 < changed_node[i] && changed_node[i] < 28) {
                    changed_node[i] = changed_node[i] - 12;
                }
            }
        } else if (move === 14) {
            for (let i = 0; i < changed_node.length; i++) {
                if (-1 < changed_node[i] && changed_node[i] < 4) {
                    changed_node[i] = 4 * changed_node[i];
                } else if (7 < changed_node[i] && changed_node[i] < 12) {
                    changed_node[i] = 4 * changed_node[i] - 31;
                } else if (15 < changed_node[i] && changed_node[i] < 20) {
                    changed_node[i] = 4 * changed_node[i] - 62;
                } else if (23 < changed_node[i] && changed_node[i] < 28) {
                    changed_node[i] = 4 * changed_node[i] - 93;
                }
            }
        } else if (move === 4) {
            for (let i = 0; i < changed_node.length; i++) {
                if (-1 < changed_node[i] && changed_node[i] < 4) {
                    changed_node[i] = 15 - changed_node[i];
                } else if (7 < changed_node[i] && changed_node[i] < 12) {
                    changed_node[i] = 19 - changed_node[i];
                } else if (15 < changed_node[i] && changed_node[i] < 20) {
                    changed_node[i] = 23 - changed_node[i];
                } else if (23 < changed_node[i] && changed_node[i] < 28) {
                    changed_node[i] = 27 - changed_node[i];
                }
            }
        } else if (move === 1) {
            for (let i = 0; i < changed_node.length; i++) {
                if (-1 < changed_node[i] && changed_node[i] < 4) {
                    changed_node[i] = 15 - 4 * changed_node[i];
                } else if (7 < changed_node[i] && changed_node[i] < 12) {
                    changed_node[i] = 46 - 4 * changed_node[i];
                } else if (15 < changed_node[i] && changed_node[i] < 20) {
                    changed_node[i] = 77 - 4 * changed_node[i];
                } else if (23 < changed_node[i] && changed_node[i] < 28) {
                    changed_node[i] = 108 - 4 * changed_node[i];
                }
            }
        }
    }
}

function updateWhiteNode(next_node) {
    if (next_node !== -1) {
        white_node = next_node;
    }
}

function getCurrentWhiteNode() {
    return white_node;
}

function getChangedNode() {
    return [...changed_node];
}