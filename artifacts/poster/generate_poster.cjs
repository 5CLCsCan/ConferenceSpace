const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '../..');
const OUT = __dirname;
const W = 4961;
const H = 3508;

const C = {
  navy: '#123A4B',
  teal: '#2E7C8F',
  light: '#8FC1D4',
  pale: '#CFE3EA',
  gold: '#E0A03C',
  ink: '#22333B',
  muted: '#61757E',
  bg: '#EEF5F7',
  white: '#FFFFFF',
  red: '#D9685A',
  green: '#48A17A',
};

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function wrapText(text, maxWidth, fontSize, weight = 400) {
  const avg = fontSize * (weight >= 700 ? 0.59 : 0.54);
  const maxChars = Math.max(8, Math.floor(maxWidth / avg));
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(text, x, y, width, opts = {}) {
  const size = opts.size || 31;
  const lineHeight = opts.lineHeight || Math.round(size * 1.34);
  const weight = opts.weight || 400;
  const color = opts.color || C.ink;
  const lines = Array.isArray(text) ? text : wrapText(text, width, size, weight);
  const anchor = opts.anchor || 'start';
  const style = opts.italic ? 'font-style="italic"' : '';
  const tspans = lines.map((line, i) =>
    `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`
  ).join('');
  return {
    svg: `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" ${style}>${tspans}</text>`,
    height: Math.max(lineHeight, lines.length * lineHeight),
    lines,
  };
}

function card(x, y, w, h, title, accent = C.teal) {
  return `
    <g filter="url(#shadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="${C.white}"/>
      <rect x="${x}" y="${y}" width="18" height="${h}" rx="9" fill="${accent}"/>
    </g>
    <circle cx="${x + 67}" cy="${y + 70}" r="25" fill="${accent}" opacity="0.16"/>
    <circle cx="${x + 67}" cy="${y + 70}" r="10" fill="${accent}"/>
    <text x="${x + 112}" y="${y + 87}" fill="${C.navy}" font-size="52" font-weight="800">${esc(title)}</text>
    <line x1="${x + 50}" y1="${y + 123}" x2="${x + w - 50}" y2="${y + 123}" stroke="${C.pale}" stroke-width="3"/>
  `;
}

function pill(x, y, w, h, top, bottom, fill = C.navy) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${fill}"/>
    <text x="${x + w / 2}" y="${y + 62}" text-anchor="middle" fill="${C.white}" font-size="44" font-weight="800">${esc(top)}</text>
    <text x="${x + w / 2}" y="${y + 106}" text-anchor="middle" fill="${C.white}" opacity="0.82" font-size="24" font-weight="600">${esc(bottom)}</text>
  `;
}

function donut(cx, cy, r, pct, color, label, sublabel) {
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct / 100;
  const gap = circumference - dash;
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.pale}" stroke-width="25"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="25"
      stroke-linecap="round" stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="${C.navy}" font-size="50" font-weight="800">${String(pct).replace('.', ',')}%</text>
    <text x="${cx}" y="${cy + r + 58}" text-anchor="middle" fill="${C.ink}" font-size="24" font-weight="700">${esc(label)}</text>
    <text x="${cx}" y="${cy + r + 91}" text-anchor="middle" fill="${C.muted}" font-size="21">${esc(sublabel)}</text>
  `;
}

function discussionTile(x, y, w, h, title, body, accent) {
  const block = textBlock(body, x + 30, y + 88, w - 60, { size: 25, lineHeight: 34, color: C.ink });
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${accent}" opacity="0.10"/>
    <rect x="${x}" y="${y}" width="${w}" height="13" rx="7" fill="${accent}"/>
    <text x="${x + 30}" y="${y + 57}" fill="${C.navy}" font-size="29" font-weight="800">${esc(title)}</text>
    ${block.svg}
  `;
}

async function main() {
  const uiPath = path.join(ROOT, 'frontend/public/onboarding/author/01-conferences.png');
  const uiData = fs.readFileSync(uiPath).toString('base64');

  const x1 = 100, x2 = 1710, x3 = 3320, cw = 1540;
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="header" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.navy}"/>
      <stop offset="0.55" stop-color="${C.teal}"/>
      <stop offset="1" stop-color="#4A97A5"/>
    </linearGradient>
    <linearGradient id="callout" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.navy}"/>
      <stop offset="1" stop-color="${C.teal}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="13" flood-color="#123A4B" flood-opacity="0.12"/>
    </filter>
    <clipPath id="screenClip"><rect x="1760" y="1136" width="1440" height="650" rx="24"/></clipPath>
    <style>text { font-family: Verdana, Arial, sans-serif; }</style>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect width="${W}" height="560" fill="url(#header)"/>
  <path d="M0 458 C950 545 1700 402 2570 493 C3450 586 4170 430 4961 500 L4961 560 L0 560 Z" fill="#FFFFFF" opacity="0.09"/>
  <circle cx="4580" cy="30" r="400" fill="#FFFFFF" opacity="0.05"/>
  <circle cx="4200" cy="510" r="290" fill="${C.gold}" opacity="0.10"/>

  <!-- Header mark -->
  <g transform="translate(115 75)">
    <rect x="0" y="0" width="250" height="250" rx="55" fill="#FFFFFF" opacity="0.98"/>
    <path d="M55 73 H195 M55 125 H164 M55 177 H195" stroke="${C.teal}" stroke-width="20" stroke-linecap="round"/>
    <circle cx="195" cy="125" r="28" fill="${C.gold}"/>
    <text x="125" y="308" text-anchor="middle" fill="#FFFFFF" font-size="29" font-weight="700">CONFERENCE SPACE</text>
  </g>
  <text x="415" y="94" fill="#FFFFFF" opacity="0.88" font-size="29" font-weight="700">TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN · KHOA CÔNG NGHỆ THÔNG TIN · ĐHQG-HCM</text>
  <text x="415" y="205" fill="#FFFFFF" font-size="96" font-weight="800">ConferenceSpace</text>
  <text x="415" y="289" fill="#FFFFFF" font-size="62" font-weight="700">Hệ thống hỗ trợ xét duyệt bài báo khoa học</text>
  <text x="415" y="356" fill="#E7F4F7" font-size="31" font-style="italic">Mô hình ba lớp trách nhiệm cho vòng đời xét duyệt: Nghiệp vụ cốt lõi · Thuật toán kiểm chứng · AI hỗ trợ có kiểm soát</text>
  <text x="415" y="425" fill="#FFFFFF" font-size="27" font-weight="600">Cao Hữu Khương Duy · Nhâm Đức Huy · Võ Minh Khôi · Từ Chí Tiến · Nguyễn Ngọc Anh Tú</text>
  <text x="415" y="472" fill="#FFFFFF" opacity="0.83" font-size="24">GVHD: ThS. Hồ Thị Hoàng Vy · PGS.TS. Lê Nguyễn Hoài Nam</text>
  <text x="4840" y="472" fill="#FFFFFF" text-anchor="end" font-size="25" font-weight="700">Thực tập Dự án Tốt nghiệp · 07/2026</text>

  <!-- Column 1 -->
  ${card(x1, 630, cw, 890, 'GIỚI THIỆU', C.teal)}
  `;

  let y = 800;
  let b = textBlock('Quy mô công bố tại các hội nghị khoa học tăng nhanh: NeurIPS 2025 ghi nhận 21.575 bài nộp và 21.921 phản biện viên. Khi khối lượng công việc vượt quá nguồn phản biện có kinh nghiệm, chất lượng và tính nhất quán của quy trình xét duyệt bị đe dọa.', x1 + 55, y, cw - 110, { size: 29, lineHeight: 41 });
  svg += b.svg; y += b.height + 24;
  b = textBlock('LLM có thể hỗ trợ đọc, rà soát và tổng hợp thông tin, nhưng phải bảo mật bản thảo, duy trì trách nhiệm của con người và không thay thế phán đoán chuyên môn.', x1 + 55, y, cw - 110, { size: 29, lineHeight: 41 });
  svg += b.svg; y += b.height + 24;
  b = textBlock('ConferenceSpace quản lý toàn bộ vòng đời xét duyệt cho ba vai trò: Tác giả, Phản biện viên và Chủ tọa; đồng thời xác định rõ cơ chế xử lý, loại đầu ra và người chịu trách nhiệm kiểm tra.', x1 + 55, y, cw - 110, { size: 29, lineHeight: 41 });
  svg += b.svg;
  svg += `
    <rect x="${x1 + 55}" y="1292" width="${cw - 110}" height="166" rx="26" fill="url(#callout)"/>
    <text x="${x1 + cw / 2}" y="1354" text-anchor="middle" fill="#FFFFFF" font-size="38" font-weight="800">3 VAI TRÒ · 3 LỚP TRÁCH NHIỆM · 6 LUỒNG AI</text>
    <text x="${x1 + cw / 2}" y="1410" text-anchor="middle" fill="#FFFFFF" opacity="0.86" font-size="24">Ranh giới không nằm ở “có/không dùng AI”.</text>
  `;

  svg += card(x1, 1580, cw, 1810, 'PHƯƠNG PHÁP & KIẾN TRÚC', C.gold);
  b = textBlock('Quy trình 3 bước: Khảo sát hiện trạng → Thiết kế mô hình ba lớp → Xây dựng & đánh giá đa bằng chứng.', x1 + 55, 1750, cw - 110, { size: 29, lineHeight: 41, weight: 700, color: C.navy });
  svg += b.svg;

  const lx = x1 + 75, lw = cw - 150;
  const layers = [
    { y: 1885, color: C.navy, n: '01', title: 'LỚP NGHIỆP VỤ CỐT LÕI', body: '10 use case · trạng thái · quyền hạn · vòng đời xét duyệt', out: 'Đầu ra: dữ liệu nghiệp vụ chính thức' },
    { y: 2165, color: C.teal, n: '02', title: 'LỚP THUẬT TOÁN KIỂM CHỨNG', body: 'Greedy + Jaccard · xung đột lợi ích từ 3 nguồn', out: 'Đầu ra: đề xuất có điểm số và lý do' },
    { y: 2445, color: C.gold, n: '03', title: 'LỚP AI HỖ TRỢ CÓ KIỂM SOÁT', body: '6 luồng AI: sinh nháp · cảnh báo · phân tích · tổng hợp', out: 'Không tự ra quyết định học thuật' },
  ];
  for (const l of layers) {
    svg += `
      <rect x="${lx}" y="${l.y}" width="${lw}" height="230" rx="28" fill="${l.color}" opacity="0.11" stroke="${l.color}" stroke-width="3"/>
      <circle cx="${lx + 90}" cy="${l.y + 115}" r="58" fill="${l.color}"/>
      <text x="${lx + 90}" y="${l.y + 131}" text-anchor="middle" fill="#FFFFFF" font-size="42" font-weight="800">${l.n}</text>
      <text x="${lx + 175}" y="${l.y + 70}" fill="${C.navy}" font-size="30" font-weight="800">${l.title}</text>
      <text x="${lx + 175}" y="${l.y + 121}" fill="${C.ink}" font-size="25">${l.body}</text>
      <text x="${lx + 175}" y="${l.y + 169}" fill="${l.color}" font-size="24" font-weight="700">${l.out}</text>
    `;
  }
  svg += `
    <rect x="${x1 + 55}" y="2730" width="${cw - 110}" height="150" rx="24" fill="${C.navy}"/>
    <text x="${x1 + 90}" y="2790" fill="#FFFFFF" font-size="28" font-weight="800">NGUYÊN TẮC KIỂM SOÁT</text>
    <text x="${x1 + 90}" y="2837" fill="#FFFFFF" font-size="24">AI không tự cập nhật trạng thái hệ thống;</text>
    <text x="${x1 + 90}" y="2872" fill="#FFFFFF" font-size="24">người dùng có thẩm quyền luôn kiểm tra và quyết định.</text>
    <text x="${x1 + 55}" y="2965" fill="${C.navy}" font-size="28" font-weight="800">CÔNG NGHỆ</text>
    <text x="${x1 + 55}" y="3012" fill="${C.ink}" font-size="27">Next.js · Go · PostgreSQL · Neo4j · Redis · Docker</text>
    <text x="${x1 + 55}" y="3094" fill="${C.navy}" font-size="28" font-weight="800">ĐÁNH GIÁ</text>
    <text x="${x1 + 55}" y="3141" fill="${C.ink}" font-size="26">k6 · Go microbenchmark · Exact Match / ROUGE / F1</text>
    <text x="${x1 + 55}" y="3182" fill="${C.ink}" font-size="26">TCA (Truthfulness–Coverage–Additionality) · UAT</text>
    <rect x="${x1 + 55}" y="3240" width="${cw - 110}" height="92" rx="20" fill="${C.gold}" opacity="0.16"/>
    <text x="${x1 + cw / 2}" y="3298" text-anchor="middle" fill="${C.navy}" font-size="25" font-weight="700">Con người chịu trách nhiệm cuối cùng ở mọi quyết định.</text>
  `;

  <!-- Column 2: results -->
  svg += card(x2, 630, cw, 2120, 'KẾT QUẢ ĐÁNH GIÁ', C.teal);
  b = textBlock('Đánh giá đa lớp bằng chứng: hiệu năng backend, chi phí thuật toán, độ chính xác của 6 luồng AI và kiểm thử chấp nhận người dùng.', x2 + 55, 800, cw - 110, { size: 27, lineHeight: 38, italic: true, color: C.muted });
  svg += b.svg;
  svg += `
    ${pill(x2 + 55, 930, 430, 135, 'p95 < 120 ms', 'độ trễ backend', C.navy)}
    ${pill(x2 + 505, 930, 430, 135, '0%', 'yêu cầu lỗi', C.teal)}
    ${pill(x2 + 955, 930, 530, 135, '369–572 req/s', '3 kịch bản tải k6', C.gold)}
    <rect x="${x2 + 50}" y="1125" width="${cw - 100}" height="675" rx="28" fill="#E8F0F2" stroke="${C.pale}" stroke-width="4"/>
    <image x="${x2 + 50}" y="1136" width="${cw - 100}" height="650" preserveAspectRatio="xMidYMid slice" clip-path="url(#screenClip)" href="data:image/png;base64,${uiData}"/>
    <text x="${x2 + 55}" y="1840" fill="${C.muted}" font-size="22" font-style="italic">Giao diện ConferenceSpace — danh sách hội nghị (vai trò Tác giả).</text>
    <text x="${x2 + 55}" y="1920" fill="${C.navy}" font-size="31" font-weight="800">ĐỘ CHÍNH XÁC CÁC LUỒNG AI</text>
    ${donut(x2 + 285, 2120, 118, 98.2, C.teal, 'KHỚP TIÊU ĐỀ', 'Submission Autofill')}
    ${donut(x2 + 770, 2120, 118, 96.2, C.gold, 'TRÍCH DẪN BÁM NGUỒN', 'Reviewer Initial Analysis')}
    ${donut(x2 + 1255, 2120, 118, 87.3, C.red, 'TRUNG THỰC BẰNG CHỨNG', 'Chair Decision Copilot')}
    <text x="${x2 + 55}" y="2425" fill="${C.muted}" font-size="23">Theo khung TCA và đối sánh siêu dữ liệu · n = 1.127 bài</text>
    <line x1="${x2 + 55}" y1="2470" x2="${x2 + cw - 55}" y2="2470" stroke="${C.pale}" stroke-width="3"/>
    <text x="${x2 + 55}" y="2535" fill="${C.navy}" font-size="29" font-weight="800">ĐỐI SÁNH PHẢN BIỆN VIÊN</text>
    <rect x="${x2 + 55}" y="2570" width="660" height="120" rx="22" fill="${C.teal}" opacity="0.11"/>
    <text x="${x2 + 90}" y="2644" fill="${C.teal}" font-size="48" font-weight="800">Hit@10 65%</text>
    <rect x="${x2 + 745}" y="2570" width="740" height="120" rx="22" fill="${C.gold}" opacity="0.14"/>
    <text x="${x2 + 785}" y="2644" fill="#A86D14" font-size="48" font-weight="800">MRR 0,392</text>
  `;

  svg += card(x2, 2810, cw, 580, 'KIỂM THỬ NGƯỜI DÙNG', C.gold);
  svg += `
    <text x="${x2 + 90}" y="2980" fill="${C.navy}" font-size="82" font-weight="800">91</text>
    <text x="${x2 + 255}" y="2970" fill="${C.ink}" font-size="31" font-weight="700">phản hồi UAT</text>
    <text x="${x2 + 255}" y="3015" fill="${C.muted}" font-size="25">Tác giả · Phản biện viên · Chủ tọa</text>
    <rect x="${x2 + 55}" y="3070" width="${cw - 110}" height="185" rx="28" fill="url(#callout)"/>
    <text x="${x2 + 95}" y="3153" fill="#FFFFFF" font-size="64" font-weight="800">73 / 91</text>
    <text x="${x2 + 425}" y="3146" fill="#FFFFFF" font-size="34" font-weight="700">sẽ giới thiệu ConferenceSpace</text>
    <text x="${x2 + 425}" y="3195" fill="#FFFFFF" opacity="0.80" font-size="24">Tín hiệu chấp nhận tích cực trong thử nghiệm.</text>
    <text x="${x2 + 55}" y="3330" fill="${C.muted}" font-size="23">Ghi chú: mẫu UAT lệch về nhóm Tác giả; cần mở rộng đánh giá.</text>
  `;

  <!-- Column 3 -->
  svg += card(x3, 630, cw, 1080, 'KẾT LUẬN', C.gold);
  const rows = [
    ['Hiệu năng backend (k6)', 'p95 < 120 ms · lỗi 0%'],
    ['Đối sánh phản biện viên', 'Hit@10 65% · MRR 0,392'],
    ['Submission Autofill', 'F1 tiêu đề 98,2% · từ khóa 92,8%'],
    ['Reviewer Initial Analysis', 'Trích dẫn bám nguồn 96,2%'],
    ['Chair Decision Copilot', 'Trung thực bằng chứng 87,3%'],
    ['Chatbot Agent', 'Gọi công cụ 75,8% · rò rỉ dữ liệu 0'],
    ['Kiểm thử người dùng', '91 phản hồi · 73/91 sẽ giới thiệu'],
  ];
  svg += `
    <rect x="${x3 + 55}" y="790" width="${cw - 110}" height="74" rx="14" fill="${C.navy}"/>
    <text x="${x3 + 85}" y="840" fill="#FFFFFF" font-size="25" font-weight="800">HẠNG MỤC ĐÁNH GIÁ</text>
    <text x="${x3 + 770}" y="840" fill="#FFFFFF" font-size="25" font-weight="800">KẾT QUẢ CHÍNH</text>
  `;
  rows.forEach((row, i) => {
    const ry = 864 + i * 82;
    svg += `
      <rect x="${x3 + 55}" y="${ry}" width="${cw - 110}" height="82" fill="${i % 2 ? '#F4F8F9' : '#EAF3F5'}"/>
      <text x="${x3 + 85}" y="${ry + 52}" fill="${C.ink}" font-size="23" font-weight="700">${esc(row[0])}</text>
      <text x="${x3 + 770}" y="${ry + 52}" fill="${C.ink}" font-size="22">${esc(row[1])}</text>
    `;
  });
  svg += `
    <rect x="${x3 + 55}" y="1485" width="${cw - 110}" height="160" rx="25" fill="${C.gold}" opacity="0.17"/>
    <text x="${x3 + 90}" y="1542" fill="${C.navy}" font-size="28" font-weight="800">KẾT LUẬN CHÍNH</text>
    <text x="${x3 + 90}" y="1590" fill="${C.ink}" font-size="24">AI là lớp hỗ trợ bổ sung; quyền đánh giá và quyết định</text>
    <text x="${x3 + 90}" y="1627" fill="${C.ink}" font-size="24">học thuật vẫn thuộc về con người.</text>
  `;

  svg += card(x3, 1770, cw, 930, 'THẢO LUẬN', C.teal);
  svg += discussionTile(x3 + 55, 1925, 690, 310, 'ĐÓNG GÓP', 'Nền tảng quản lý vòng đời; mô hình ba lớp phân tách trách nhiệm; chuỗi bằng chứng theo từng tác vụ.', C.teal);
  svg += discussionTile(x3 + 795, 1925, 690, 310, 'GIỚI HẠN', 'TCA/NLI chưa hiệu chuẩn bằng nhãn chuyên gia; dữ liệu chủ yếu tiếng Anh; UAT lệch về nhóm Tác giả.', C.red);
  svg += discussionTile(x3 + 55, 2270, 690, 310, 'Ý NGHĨA', 'Cần xác lập tác vụ được hỗ trợ, dữ liệu được phép xử lý và người chịu trách nhiệm kiểm tra đầu ra.', C.gold);
  svg += discussionTile(x3 + 795, 2270, 690, 310, 'HƯỚNG PHÁT TRIỂN', 'Nhãn chuyên gia; RAG có kiểm soát; hàng đợi bất đồng bộ; nhật ký kiểm toán; mở rộng DBLP và Semantic Scholar.', C.green);

  svg += card(x3, 2760, cw, 630, 'THAM KHẢO & CẢM ƠN', C.navy);
  const refs = [
    '[1] Azad & Banu (2024). Publication trends in AI conferences. arXiv:2412.07793.',
    '[2] NeurIPS Foundation. NeurIPS 2025 Fact Sheet.',
    '[3] Stelmakh et al. (2020). A novice-reviewer experiment. arXiv:2011.15050.',
    '[4] Kim, Lee & Lee (2025). The AI conference peer review crisis. arXiv:2505.04966.',
  ];
  refs.forEach((ref, i) => {
    svg += `<text x="${x3 + 55}" y="${2940 + i * 50}" fill="${C.ink}" font-size="21">${esc(ref)}</text>`;
  });
  svg += `
    <line x1="${x3 + 55}" y1="3155" x2="${x3 + cw - 55}" y2="3155" stroke="${C.pale}" stroke-width="3"/>
    <text x="${x3 + 55}" y="3212" fill="${C.navy}" font-size="25" font-weight="800">LỜI CẢM ƠN</text>
    <text x="${x3 + 55}" y="3260" fill="${C.ink}" font-size="22">Nhóm xin cảm ơn PGS.TS. Lê Nguyễn Hoài Nam, ThS. Hồ Thị Hoàng Vy</text>
    <text x="${x3 + 55}" y="3295" fill="${C.ink}" font-size="22">và Khoa Công nghệ Thông tin – Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM.</text>
    <text x="${x3 + cw - 55}" y="3345" text-anchor="end" fill="${C.muted}" font-size="19">Poster tóm tắt · Danh sách tài liệu đầy đủ trong báo cáo</text>
  `;

  svg += `
    <text x="100" y="3470" fill="${C.muted}" font-size="20">ConferenceSpace · Hệ thống hỗ trợ xét duyệt bài báo khoa học</text>
    <text x="4861" y="3470" text-anchor="end" fill="${C.muted}" font-size="20">Đồ án tốt nghiệp · 07/2026</text>
  </svg>`;

  const svgPath = path.join(OUT, 'conferencespace-poster.svg');
  const pngPath = path.join(OUT, 'conferencespace-poster.png');
  const previewPath = path.join(OUT, 'conferencespace-poster-preview.png');
  fs.writeFileSync(svgPath, svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);
  await sharp(Buffer.from(svg)).resize({ width: 1800 }).png({ compressionLevel: 9 }).toFile(previewPath);
  console.log(JSON.stringify({ svgPath, pngPath, previewPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
