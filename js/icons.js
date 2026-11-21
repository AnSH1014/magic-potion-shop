// 화면 UI에 쓰는 작은 그림들 (SVG: 도형을 글자로 적어 그리는 그림 형식. 파일 없이 코드 안에 넣을 수 있다)
// 목업(references/05_ui_mockup.webp)처럼 동글동글한 아이콘을 원·타원·둥근 사각형으로 단순하게 그린다.

const svg = (body, view = '0 0 48 48') => `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

// ───── 재료 5종 ─────
export const INGREDIENT_ICONS = {
  dewflower: svg(`
    <path d="M24 30 C24 36 23 40 22 44" stroke="#7CC46A" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="17" cy="40" rx="6" ry="3.5" fill="#8CD27A" transform="rotate(-25 17 40)"/>
    ${[0, 72, 144, 216, 288].map((a) => `<circle cx="24" cy="12" r="7" fill="#A8D8FF" transform="rotate(${a} 24 20)"/>`).join('')}
    <circle cx="24" cy="20" r="5.5" fill="#FFE27A"/>`),
  mushroom: svg(`
    <rect x="18" y="24" width="12" height="18" rx="6" fill="#FFF1DC"/>
    <path d="M5 27 C5 12 15 5 24 5 C33 5 43 12 43 27 Z" fill="#FF9EBB"/>
    <circle cx="16" cy="16" r="3.5" fill="#FFFFFF"/><circle cx="29" cy="12" r="3" fill="#FFFFFF"/><circle cx="35" cy="21" r="3" fill="#FFFFFF"/><circle cx="23" cy="22" r="2.4" fill="#FFFFFF"/>`),
  mint: svg(`
    <ellipse cx="17" cy="22" rx="8" ry="14" fill="#BDE89C" transform="rotate(-30 17 22)"/>
    <ellipse cx="31" cy="22" rx="8" ry="14" fill="#A6DC82" transform="rotate(30 31 22)"/>
    <ellipse cx="24" cy="30" rx="8" ry="13" fill="#C9EFAE"/>
    <path d="M24 22 V44" stroke="#7CC46A" stroke-width="3" stroke-linecap="round"/>`),
  starberry: svg(`
    <circle cx="24" cy="32" r="13" fill="#8CCB6E"/>
    <path d="M24 4 L28.5 14 L39 15 L31 22 L33.5 32.5 L24 27 L14.5 32.5 L17 22 L9 15 L19.5 14 Z" fill="#FFD37A" stroke="#F2B84B" stroke-width="1.5" stroke-linejoin="round"/>`),
  moonpumpkin: svg(`
    <path d="M24 12 C24 8 26 5 29 4" stroke="#7CC46A" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="15" cy="29" rx="10" ry="13" fill="#B7A2EC"/>
    <ellipse cx="33" cy="29" rx="10" ry="13" fill="#B7A2EC"/>
    <ellipse cx="24" cy="29" rx="10" ry="14" fill="#C9B3F0"/>
    <ellipse cx="20" cy="22" rx="3" ry="5" fill="#E3D7FA" opacity="0.8"/>`),
};

// ───── 물약 병 (색만 바꿔 쓴다) ─────
export function potionIcon(color, empty = false) {
  return svg(`
    <rect x="18" y="4" width="12" height="7" rx="2.5" fill="#C98E6A"/>
    <rect x="19.5" y="10" width="9" height="9" rx="2" fill="#F4F0FA"/>
    <circle cx="24" cy="30" r="15" fill="#F4F0FA"/>
    <path d="M10.5 32 A13.5 13.5 0 0 0 37.5 32 Z" fill="${empty ? '#E2DCE6' : color}"/>
    <ellipse cx="18" cy="25" rx="3" ry="5" fill="#FFFFFF" opacity="0.8"/>`);
}

// ───── 코인 (별이 새겨진 금화) ─────
export const COIN_ICON = svg(`
  <circle cx="24" cy="24" r="21" fill="#F7B93E"/>
  <circle cx="24" cy="24" r="17" fill="#FFD37A"/>
  <path d="M24 12 L27.3 19.4 L35.3 20.1 L29.2 25.4 L31 33.3 L24 29.1 L17 33.3 L18.8 25.4 L12.7 20.1 L20.7 19.4 Z" fill="#F7B93E"/>`);

// ───── 메뉴 아이콘 ─────
export const BAG_ICON = svg(`
  <path d="M17 14 C17 7 31 7 31 14" stroke="#B9825E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <rect x="7" y="13" width="34" height="30" rx="10" fill="#F2B866"/>
  <path d="M7 22 C7 16 12 13 17 13 H31 C36 13 41 16 41 22 V26 H7 Z" fill="#E9A24F"/>
  <rect x="20" y="22" width="8" height="8" rx="2.5" fill="#FFE27A"/>`);
export const BOOK_ICON = svg(`
  <rect x="9" y="6" width="30" height="37" rx="6" fill="#B59BE8"/>
  <rect x="9" y="37" width="30" height="6" rx="3" fill="#FFF1DC"/>
  <rect x="9" y="6" width="7" height="37" rx="3" fill="#9D82D6"/>
  <path d="M27 14 L29.4 19.2 L35 19.8 L30.8 23.6 L32 29.2 L27 26.3 L22 29.2 L23.2 23.6 L19 19.8 L24.6 19.2 Z" fill="#FFD37A"/>`);
export const SHOP_ICON = svg(`
  <rect x="9" y="22" width="30" height="21" rx="4" fill="#FFF1DC"/>
  <rect x="19" y="29" width="10" height="14" rx="3" fill="#C98E6A"/>
  ${[0, 1, 2, 3, 4].map((i) => `<path d="M${5 + i * 7.6} 12 H${12.6 + i * 7.6} V20 A3.8 3.8 0 0 1 ${5 + i * 7.6} 20 Z" fill="${i % 2 ? '#FFF8EC' : '#FF9EBB'}"/>`).join('')}
  <rect x="5" y="8" width="38" height="5" rx="2.5" fill="#FF9EBB"/>`);
export const MUSIC_ICON = svg(`
  <path d="M19 34 V12 L36 8 V30" stroke="#6B4F45" stroke-width="3.5" fill="none" stroke-linejoin="round"/>
  <ellipse cx="15" cy="34" rx="5.5" ry="4.5" fill="#6B4F45"/><ellipse cx="32" cy="30" rx="5.5" ry="4.5" fill="#6B4F45"/>`);
export const SPEAKER_ICON = svg(`
  <path d="M8 19 H15 L25 10 V38 L15 29 H8 Z" fill="#6B4F45" stroke="#6B4F45" stroke-width="2" stroke-linejoin="round"/>
  <path d="M31 17 C34 20 34 28 31 31 M35 12 C41 18 41 30 35 36" stroke="#6B4F45" stroke-width="3" fill="none" stroke-linecap="round"/>`);
export const SEED_ICON = svg(`
  <ellipse cx="24" cy="30" rx="10" ry="13" fill="#C98E6A"/>
  <path d="M24 17 C24 10 30 6 36 7 C35 13 30 16 24 17 Z" fill="#8CD27A"/>
  <path d="M24 17 C24 11 18 8 13 9 C14 14 19 16 24 17 Z" fill="#A6DC82"/>`);
