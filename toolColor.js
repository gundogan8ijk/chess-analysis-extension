/**
 * Extension: Tô màu ô vuông hỗ trợ phân tích nước đi cờ vua
 * Tối ưu hóa cấu trúc mã nguồn, nâng cao khả năng bảo trì và sửa lỗi gọi API Stockfish.
 */

// =============================================================================
// 1. HẰNG SỐ CẤU HÌNH (CONSTANTS)
// =============================================================================
const CONFIG = {
    SELECTORS: {
        MAIN_LINE_PLY: "div.node.main-line-ply",
        PIECE: "piece",
        HIGHLIGHT: ".highlight",
        NODE_HIGHLIGHT_CONTENT: ".node-highlight-content",
        ICON_FONT_CHESS: "span.icon-font-chess",
        MY_COLOR_INDICATOR: 'text[x="97.5"][y="99"]',
        CONTAINERS: [".move-list", ".moves", ".main-line"]
    },
    COLORS: {
        HIGHLIGHT_BG_RGBA: "rgba(28, 73, 198, 0.8)",
        HIGHLIGHT_BG_RGB: "rgb(28, 73, 198)"
    },
    API: {
        STOCKFISH_URL: "https://stockfish.online/api/s/v2.php",
        DEPTH: 10
    },
    PIECE_MAP: {
        'wp': 'P', 'wn': 'N', 'wb': 'B', 'wr': 'R', 'wq': 'Q', 'wk': 'K',
        'bp': 'p', 'bn': 'n', 'bb': 'b', 'br': 'r', 'bq': 'q', 'bk': 'k'
    }
};

// =============================================================================
// 2. QUẢN LÝ TRẠNG THÁI (STATE)
// =============================================================================
const state = {
    whiteKingMoved: false,
    whiteRookAMoved: false,
    whiteRookHMoved: false,
    blackKingMoved: false,
    blackRookAMoved: false,
    blackRookHMoved: false
};

const history = {
    whiteKingMoved: false,
    whiteRookAMoved: false,
    whiteRookHMoved: false,
    blackKingMoved: false,
    blackRookAMoved: false,
    blackRookHMoved: false
};

/**
 * Đặt lại toàn bộ trạng thái di chuyển của Vua và Xe (Castling State)
 */
function resetCastlingState() {
    state.whiteKingMoved = false;
    state.whiteRookAMoved = false;
    state.whiteRookHMoved = false;
    state.blackKingMoved = false;
    state.blackRookAMoved = false;
    state.blackRookHMoved = false;

    history.whiteKingMoved = false;
    history.whiteRookAMoved = false;
    history.whiteRookHMoved = false;
    history.blackKingMoved = false;
    history.blackRookAMoved = false;
    history.blackRookHMoved = false;
}

// =============================================================================
// 3. CÁC HÀM TIỆN ÍCH HỖ TRỢ (HELPER UTILITIES)
// =============================================================================

/**
 * Chuyển đổi tên cột (a-h) sang dạng số (1-8)
 * @param {string} col
 * @returns {number}
 */
function colToNumber(col) {
    return col.charCodeAt(0) - "a".charCodeAt(0) + 1;
}

/**
 * Lấy nội dung nước đi và loại bỏ icon quân cờ
 * @param {Element} node
 * @returns {string}
 */
function getMoveText(node) {
    const span = node.querySelector(CONFIG.SELECTORS.NODE_HIGHLIGHT_CONTENT);
    if (!span) return "";

    const clone = span.cloneNode(true);
    clone.querySelectorAll(CONFIG.SELECTORS.ICON_FONT_CHESS).forEach(i => i.remove());
    return clone.textContent.trim();
}

/**
 * Trích xuất ô đích từ chuỗi mô tả nước đi
 * @param {string} text
 * @returns {string|null}
 */
function getTargetSquareFromMove(text) {
    // Loại bỏ các ký tự chiếu tướng (+) hoặc chiếu bí (#) ở cuối
    text = text.replace(/[+#]/g, "");

    // Tìm ô đích (ví dụ: e4, Nf3 -> f3) ở cuối chuỗi
    const match = text.match(/([a-h][1-8])$/);
    return match ? match[1] : null;
}

// =============================================================================
// 4. LOGIC XỬ LÝ TRÊN BÀN CỜ (CHESS ENGINE HELPERS)
// =============================================================================

/**
 * Lấy màu của lượt đi tiếp theo dựa trên số lượng nước đi trong danh sách
 * @returns {string} 'w' (Trắng) hoặc 'b' (Đen)
 */
function getActiveColor() {
    const nodes = document.querySelectorAll(CONFIG.SELECTORS.MAIN_LINE_PLY);
    if (nodes.length === 0) return 'w';
    return (nodes.length % 2 === 0) ? 'w' : 'b';
}

/**
 * Lấy màu quân cờ của người chơi hiện tại
 * @returns {string} 'w' hoặc 'b'
 */
function myColorPiece() {
    const elem = document.querySelector(CONFIG.SELECTORS.MY_COLOR_INDICATOR);
    if (!elem) return 'w'; // Fallback mặc định
    return elem.textContent === "a" ? "b" : "w";
}

/**
 * Lấy màu của bên vừa đi nước đi thứ moveNumber
 * @param {number} moveNumber
 * @returns {string}
 */
function getColorJustMoved(moveNumber) {
    return (moveNumber % 2 === 1) ? 'b' : 'w';
}

/**
 * Kiểm tra xem các Xe đã rời khỏi vị trí ban đầu chưa để cập nhật trạng thái Castling
 */
function checkRookPositions() {
    const pieces = document.getElementsByClassName(CONFIG.SELECTORS.PIECE);

    for (let piece of pieces) {
        const classList = piece.classList;

        if (classList.contains('wr')) {
            if (classList.contains('square-11')) state.whiteRookAMoved = true;
            if (classList.contains('square-81')) state.whiteRookHMoved = true;
        }

        if (classList.contains('br')) {
            if (classList.contains('square-18')) state.blackRookAMoved = true;
            if (classList.contains('square-88')) state.blackRookHMoved = true;
        }

        // Nếu tất cả Xe đã được xác định là di chuyển thì dừng sớm
        if (state.whiteRookAMoved && state.whiteRookHMoved && state.blackRookAMoved && state.blackRookHMoved) {
            break;
        }
    }
}

/**
 * Kiểm tra xem các Vua đã rời khỏi vị trí ban đầu chưa để cập nhật trạng thái Castling
 */
function checkKingPositions() {
    const pieces = document.getElementsByClassName(CONFIG.SELECTORS.PIECE);

    for (let piece of pieces) {
        const classList = piece.classList;

        if (classList.contains('wk') && classList.contains('square-51')) state.whiteKingMoved = true;
        if (classList.contains('bk') && classList.contains('square-58')) state.blackKingMoved = true;

        // Nếu cả hai Vua đã di chuyển thì dừng sớm
        if (state.whiteKingMoved && state.blackKingMoved) {
            break;
        }
    }
}

/**
 * Duyệt lịch sử nước đi để phát hiện các nước đi làm mất quyền Nhập thành (Castling Loss)
 * @param {NodeList} nodes Danh sách các nút nước đi
 */
function detectCastlingLoss(nodes) {
    for (const node of nodes) {
        const text = getMoveText(node);
        const isWhite = node.classList.contains("white-move");
        const isBlack = node.classList.contains("black-move");

        // ===== NHẬP THÀNH (O-O / O-O-O) =====
        if (text === "O-O" || text === "O-O-O") {
            if (isWhite) {
                history.whiteKingMoved = true;
                history.whiteRookHMoved = true;
                history.whiteRookAMoved = true;
            } else if (isBlack) {
                history.blackKingMoved = true;
                history.blackRookAMoved = true;
                history.blackRookHMoved = true;
            }
            continue;
        }

        // ===== CÁC NƯỚC ĐI THƯỜNG CÓ QUÂN CỜ PHÁT HIỆN QUA SPAN ICON =====
        const icon = node.querySelector(CONFIG.SELECTORS.ICON_FONT_CHESS);
        if (!icon) continue;

        const cls = icon.classList;

        // BÊN TRẮNG DI CHUYỂN
        if (cls.contains("rook-white")) {
            const file = getTargetSquareFromMove(text);
            if (file && (file[0] === "a" || file === "b1" || file === "c1" || file === "d1")) {
                history.whiteRookAMoved = true;
            }
            if (file && (file[0] === "h" || file === "g1" || file === "f1")) {
                history.whiteRookHMoved = true;
            }
        }

        if (cls.contains("king-white")) {
            history.whiteKingMoved = true;
            history.whiteRookAMoved = true;
            history.whiteRookHMoved = true;
        }

        // BÊN ĐEN DI CHUYỂN
        if (cls.contains("rook-black")) {
            const file = getTargetSquareFromMove(text);
            if (file && (file[0] === "a" || file === "b8" || file === "c8" || file === "d8")) {
                history.blackRookAMoved = true;
            }
            if (file && (file[0] === "h" || file === "g8" || file === "f8")) {
                history.blackRookHMoved = true;
            }
        }

        if (cls.contains("king-black")) {
            history.blackKingMoved = true;
            history.blackRookAMoved = true;
            history.blackRookHMoved = true;
        }

        // Dừng sớm nếu tất cả quyền nhập thành đều đã mất
        if (
            history.whiteRookAMoved && history.whiteRookHMoved && history.whiteKingMoved &&
            history.blackRookAMoved && history.blackRookHMoved && history.blackKingMoved
        ) {
            break;
        }
    }
}

/**
 * Lấy chuỗi ký hiệu Nhập thành (Castling String) cho FEN
 * @returns {string} ví dụ "KQkq", "KQ", "-"
 */
function getCastlingString() {
    const nodes = document.querySelectorAll(CONFIG.SELECTORS.MAIN_LINE_PLY);

    if (nodes.length === 0 || nodes.length === 1) {
        resetCastlingState();
        return "KQkq";
    }

    detectCastlingLoss(nodes);
    checkRookPositions();
    checkKingPositions();

    const K = (state.whiteRookHMoved && state.whiteKingMoved && !history.whiteRookHMoved && !history.whiteKingMoved);
    const Q = (state.whiteRookAMoved && state.whiteKingMoved && !history.whiteRookAMoved && !history.whiteKingMoved);
    const k = (state.blackRookHMoved && state.blackKingMoved && !history.blackRookHMoved && !history.blackKingMoved);
    const q = (state.blackRookAMoved && state.blackKingMoved && !history.blackRookAMoved && !history.blackKingMoved);

    let castLing = "";
    if (K) castLing += "K";
    if (Q) castLing += "Q";
    if (k) castLing += "k";
    if (q) castLing += "q";

    return castLing === "" ? "-" : castLing;
}

/**
 * Đếm số lượng nước đi không ăn quân và không đi Tốt (Halfmove Clock)
 * @returns {number}
 */
function countPawns() {
    const nodes = Array.from(document.querySelectorAll(CONFIG.SELECTORS.MAIN_LINE_PLY));
    let count = 0;

    for (let i = nodes.length - 1; i >= 0; i--) {
        const span = nodes[i].querySelector(CONFIG.SELECTORS.NODE_HIGHLIGHT_CONTENT);
        if (!span) continue;

        const text = span.textContent.trim();
        if (text === "O-O" || text === "O-O-O") {
            count++;
            continue;
        }

        const hasChessIcon = span.querySelector(CONFIG.SELECTORS.ICON_FONT_CHESS);
        const isCapture = text.includes("x");

        // Nếu là nước đi tốt (không có icon quân cờ khác) hoặc nước ăn quân
        if (!hasChessIcon || isCapture) {
            return count;
        }

        count++;
    }

    return count;
}

/**
 * Xác định ô bắt tốt qua đường (En Passant Square)
 * @param {Array<Array<string>>} board Ma trận bàn cờ hiện tại
 * @returns {string} Ô bắt tốt (ví dụ: "e3", "d6") hoặc "-"
 */
function getEnPassantSquare(board) {
    const highlights = Array.from(document.getElementsByClassName('highlight'))
        .filter(el => window.getComputedStyle(el).opacity === '0.5')
        .slice(-2);

    if (highlights.length < 2) return '-';

    const squares = highlights
        .map(el => [...el.classList].find(c => c.startsWith('square-'))?.replace('square-', ''))
        .filter(Boolean);

    if (squares.length < 2) return '-';

    const color = getActiveColor();

    let from, to;
    if (color === "w") {
        [from, to] = squares;
    } else {
        [to, from] = squares;
    }

    const colFrom = parseInt(from[0]);
    const rowFrom = parseInt(from[1]);

    const colTo = parseInt(to[0]);
    const rowTo = parseInt(to[1]);

    // Phải cùng cột và đi đúng 2 ô
    if (colFrom !== colTo || Math.abs(rowFrom - rowTo) !== 2) return '-';

    const a = board[8 - rowTo][colFrom - 1];

    // Đảm bảo ô đích có Tốt
    if (a !== 'P' && a !== 'p') return '-';

    const moveLeft = board[8 - rowTo][colTo];
    const moveRight = board[8 - rowTo][colTo - 2];

    // Kiểm tra xem quân tốt này có đứng cạnh quân tốt đối phương không
    if (a === 'P' && (moveLeft === "p" || moveRight === "p")) {
        return String.fromCharCode(96 + colTo) + '3';
    }

    if (a === 'p' && (moveLeft === "P" || moveRight === "P")) {
        return String.fromCharCode(96 + colTo) + '6';
    }

    return '-';
}

/**
 * Tạo trạng thái bàn cờ FEN dạng chuỗi từ ma trận bàn cờ
 * @param {Array<Array<string>>} board Ma trận 8x8
 * @returns {string}
 */
function boardToFENPosition(board) {
    let fenPosition = '';
    for (let row of board) {
        let emptyCount = 0;
        let rowStr = '';

        for (let cell of row) {
            if (cell === '') {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    rowStr += emptyCount;
                    emptyCount = 0;
                }
                rowStr += cell;
            }
        }
        if (emptyCount > 0) {
            rowStr += emptyCount;
        }
        fenPosition += (fenPosition ? '/' : '') + rowStr;
    }
    return fenPosition;
}

/**
 * Đếm số lượng lượt đi toàn cục (Fullmove Number)
 * @returns {number}
 */
function getMoveCounters() {
    const nodes = document.querySelectorAll(CONFIG.SELECTORS.MAIN_LINE_PLY);
    let fullmove = 1;

    if (nodes.length > 0) {
        fullmove = Math.floor((nodes.length + 1) / 2);
    }

    return fullmove;
}

/**
 * Đọc cấu trúc bàn cờ từ cây DOM HTML sang ma trận 8x8
 * @returns {Array<Array<string>>} Ma trận 8x8 quân cờ
 */
function getBoardFromHTML() {
    const board = Array(8).fill(null).map(() => Array(8).fill(''));
    const pieces = document.getElementsByClassName(CONFIG.SELECTORS.PIECE);

    for (let piece of pieces) {
        const classList = piece.classList;
        let pieceType = '';
        let square = '';

        for (let className of classList) {
            if (CONFIG.PIECE_MAP[className]) {
                pieceType = CONFIG.PIECE_MAP[className];
            }
            if (className.startsWith('square-')) {
                square = className.replace('square-', '');
            }
        }

        if (pieceType && square) {
            const col = parseInt(square[0]) - 1;
            const row = 8 - parseInt(square[1]);

            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                board[row][col] = pieceType;
            }
        }
    }

    return board;
}

/**
 * Biên dịch trạng thái hiện tại của bàn cờ sang mã FEN đầy đủ
 * @returns {string} Chuỗi FEN
 */
function htmlBoardToFEN() {
    const board = getBoardFromHTML();
    const fenPosition = boardToFENPosition(board);
    const activeColor = getActiveColor();
    const castling = getCastlingString();
    const enPassant = getEnPassantSquare(board);
    const countPawnsA = countPawns();
    const fullMove = getMoveCounters();

    return `${fenPosition} ${activeColor} ${castling} ${enPassant} ${countPawnsA} ${fullMove}`;
}

// =============================================================================
// 5. HIỂN THỊ HIGHLIGHT VÀ KẾT NỐI API STOCKFISH
// =============================================================================

/**
 * Tạo và chèn phần tử div highlight gợi ý nước đi tốt nhất lên bàn cờ
 * @param {string} position Vị trí ô cờ dạng text (ví dụ: "e2")
 */
function addElementDiv(position) {
    const arr = document.getElementsByClassName("highlight");
    const first = arr[0];
    if (!first) return;

    const newDiv = document.createElement("div");
    const x = position.slice(0, 1);
    const y = position.slice(1, 2);
    const xNum = colToNumber(x);

    newDiv.className = `highlight square-${xNum}${y}`;
    newDiv.style.backgroundColor = CONFIG.COLORS.HIGHLIGHT_BG_RGBA;
    newDiv.style.opacity = "0.8";
    newDiv.setAttribute("data-test-element", "highlight");
    newDiv.setAttribute("data-test-type", "highlight");

    first.parentNode.insertBefore(newDiv, first);
}

/**
 * Xóa các phần tử highlight gợi ý cũ do hệ thống tạo ra
 */
function removeCustomHighlights() {
    const allElements = Array.from(document.querySelectorAll(CONFIG.SELECTORS.HIGHLIGHT));

    allElements.forEach(el => {
        const bgColor = el.style.backgroundColor;
        if (bgColor === CONFIG.COLORS.HIGHLIGHT_BG_RGBA || bgColor === CONFIG.COLORS.HIGHLIGHT_BG_RGB) {
            el.remove();
        }
    });
}

/**
 * Gọi API Stockfish để tìm nước đi tốt nhất dựa trên chuỗi FEN hiện tại
 * @param {string} fen Chuỗi FEN cần phân tích
 */
async function analyzePosition(fen) {
    if (!fen) {
        console.warn("|| FEN không hợp lệ hoặc bị thiếu");
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API.STOCKFISH_URL}?fen=${encodeURIComponent(fen)}&depth=${CONFIG.API.DEPTH}`);
        const data = await response.json();

        if (data && data.bestmove) {
            const str = data.bestmove;
            const bestMove = str.split(" ")[1];

            const from = bestMove.slice(0, 2);
            const to = bestMove.slice(2, 4);

            addElementDiv(from);
            addElementDiv(to);
        }
    } catch (err) {
        console.error("X Lỗi gọi API Stockfish:", err.message || err);
    }
}

// =============================================================================
// 6. KHỞI TẠO VÀ LẮNG NGHE SỰ KIỆN (OBSERVERS / LISTENERS)
// =============================================================================

let lastDataNode = null;
let processingMove = false;

/**
 * Xử lý sự kiện khi có nước đi mới xuất hiện trên bàn cờ
 */
function handleMoveChange() {
    if (processingMove) return;
    processingMove = true;

    setTimeout(() => {
        const nodes = document.querySelectorAll(CONFIG.SELECTORS.MAIN_LINE_PLY);
        if (nodes.length === 0) {
            processingMove = false;
            return;
        }

        const lastNode = nodes[nodes.length - 1];
        const currentDataNode = lastNode.getAttribute("data-node");

        if (currentDataNode === lastDataNode) {
            processingMove = false;
            return;
        }

        // Xóa highlight cũ khi di chuyển sang nước mới
        removeCustomHighlights();
        lastDataNode = currentDataNode;

        const fen = htmlBoardToFEN();
        const activeColor = fen.split(' ')[1];
        const myColor = myColorPiece();

        // Chỉ gửi yêu cầu phân tích nếu đó là lượt đi của bản thân
        if (activeColor === myColor) {
            setTimeout(() => analyzePosition(fen), 260);
        }

        processingMove = false;
    }, 80);
}

/**
 * Thiết lập bộ giám sát MutationObserver tự động theo dõi nước đi
 */
function setupAutoAnalysis() {
    let container = null;
    for (let selector of CONFIG.SELECTORS.CONTAINERS) {
        container = document.querySelector(selector);
        if (container) break;
    }
    if (!container) container = document.body;

    const observer = new MutationObserver(handleMoveChange);

    observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-node"]
    });

    // Phân tích nước đi hiện tại lúc bắt đầu thiết lập
    const nodes = document.querySelectorAll(CONFIG.SELECTORS.MAIN_LINE_PLY);
    if (nodes.length > 0) {
        lastDataNode = nodes[nodes.length - 1].getAttribute("data-node");

        const myColor = myColorPiece();
        const fen = htmlBoardToFEN();
        const activeColor = fen.split(' ')[1];

        if (activeColor === myColor) {
            setTimeout(() => analyzePosition(fen), 260);
        }
    }
}

// Khởi chạy tiện ích khi trang đã sẵn sàng
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAutoAnalysis);
} else {
    setupAutoAnalysis();
}
