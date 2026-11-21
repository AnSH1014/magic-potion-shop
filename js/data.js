// 게임 데이터 (1단계에서 확정한 재료·물약·레시피)
// 화면 그리기 코드와 상관없는 순수 데이터라서 Node 테스트에서도 그대로 불러 쓸 수 있다.

// 재료 5종. starter: true 이면 처음부터 정원에서 기를 수 있다.
export const INGREDIENTS = [
  { id: 'dewflower', name: '이슬꽃',     color: '#A8D8FF', starter: true },
  { id: 'mushroom',  name: '콩콩버섯',   color: '#FFB3C6', starter: true },
  { id: 'mint',      name: '말랑민트',   color: '#BDE89C', starter: true },
  { id: 'starberry', name: '별사탕열매', color: '#FFD37A', starter: false, seedPrice: 30 },
  { id: 'moonpumpkin', name: '달빛호박', color: '#C9B3F0', starter: false, seedPrice: 80 },
];

// 물약 8종. wish는 손님이 이 물약을 원할 때 말풍선에 하는 말.
// recipe는 재료 id 목록이며 순서는 상관없고, 같은 재료는 한 번만 들어간다.
// bottle: 병 모양 (round 둥근 플라스크, cylinder 원기둥 병, cone 원뿔 플라스크,
//                  cube 큐브 병, tall 길쭉한 병, bigRound 큰 둥근 플라스크)
export const POTIONS = [
  { id: 'healing',  name: '호호 치유 물약',  recipe: ['dewflower', 'mint'],                 bottle: 'round',    color: '#9FE8D0', price: 10, hint: '시원한 잎과 맑은 이슬이 만나면…', wish: '넘어져서 무릎이 아파요… 낫게 해 주세요' },
  { id: 'sleepy',   name: '새근새근 물약',   recipe: ['dewflower', 'mushroom'],             bottle: 'cylinder', color: '#C9B3F0', price: 10, hint: '꽃과 버섯이 함께 꿈을 꿔요', wish: '요즘 밤에 잠이 안 와요' },
  { id: 'energy',   name: '뿜뿜 기운 물약',  recipe: ['mushroom', 'mint'],                  bottle: 'cone',     color: '#FFB3C6', price: 12, hint: '통통 버섯에 상쾌한 기운을 더해요', wish: '힘이 하나도 없어요. 기운 내고 싶어요!' },
  { id: 'sparkle',  name: '반짝반짝 물약',   recipe: ['starberry', 'dewflower'],            bottle: 'round',    color: '#FFE27A', price: 20, hint: '별빛이 이슬에 비치면…', wish: '밤길이 너무 어두워요' },
  { id: 'laugh',    name: '깔깔 웃음 물약',  recipe: ['starberry', 'mushroom'],             bottle: 'cylinder', color: '#FFCBA4', price: 22, hint: '달콤한 열매가 버섯을 간질여요', wish: '기분이 울적해요. 웃고 싶어요' },
  { id: 'luck',     name: '네잎 행운 물약',  recipe: ['starberry', 'mint', 'mushroom'],     bottle: 'cube',     color: '#CDEB8B', price: 30, hint: '세 가지를 함께 넣어 보세요. 별 하나가 꼭 필요해요', wish: '내일 요정 시험이 있어요! 행운이 필요해요' },
  { id: 'invisible',name: '살금 투명 물약',  recipe: ['moonpumpkin', 'dewflower', 'mint'],  bottle: 'tall',     color: '#D6F0FF', price: 35, hint: '달빛 아래 맑고 시원한 것들이 숨어요', wish: '숨바꼭질에서 꼭 이기고 싶어요' },
  { id: 'dream',    name: '둥실 꿈 물약',    recipe: ['moonpumpkin', 'starberry'],          bottle: 'bigRound', color: '#B8A6E8', price: 40, hint: '달과 별이 만나면 하늘을 날아요', wish: '하늘을 둥실둥실 날아 보고 싶어요' },
];

// 레시피에 없는 조합을 끓이면 나오는 실패작
export const FAILED_POTION = { id: 'jelly', name: '말랑한 수상한 젤리' };
