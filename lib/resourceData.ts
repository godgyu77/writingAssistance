export type ResourceType = 'world' | 'character' | 'item' | 'plot'

export interface Resource {
  id: string
  type: ResourceType
  name: string
  tags: string[]
  description: string
  aiSummary: string
  createdAt: Date
  updatedAt: Date
}

// 세계관 리소스
export const mockWorldResources: Resource[] = [
  {
    id: 'w1',
    type: 'world',
    name: '서재의 비밀',
    tags: ['장소', '핵심'],
    description: '오래된 서재. 달빛이 들어오는 창문이 있으며, 먼지 낀 고서들이 가득하다.',
    aiSummary: '주인공이 거주하는 신비로운 분위기의 오래된 서재',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-01')
  },
  {
    id: 'w2',
    type: 'world',
    name: '달의 왕국',
    tags: ['왕국', '배경'],
    description: '달빛이 지배하는 환상적인 왕국. 밤에만 존재하며 낮이 되면 사라진다.',
    aiSummary: '밤에만 나타나는 환상의 왕국',
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-02-03')
  }
]

// 인물 리소스
export const mockCharacterResources: Resource[] = [
  {
    id: 'c1',
    type: 'character',
    name: '주인공',
    tags: ['주인공', '서재지기'],
    description: '조용한 성격의 서재 관리인. 과거의 비밀을 간직하고 있다.',
    aiSummary: '비밀을 간직한 조용한 서재 관리인',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-02-05')
  },
  {
    id: 'c2',
    type: 'character',
    name: '미스터리한 방문자',
    tags: ['조연', '신비'],
    description: '달빛을 타고 나타난 정체불명의 인물. 우아하고 신비로운 분위기.',
    aiSummary: '달빛과 함께 나타난 신비로운 방문자',
    createdAt: new Date('2026-01-25'),
    updatedAt: new Date('2026-02-04')
  },
  {
    id: 'c3',
    type: 'character',
    name: '시간의 수호자',
    tags: ['적대자', '강력'],
    description: '시간을 관리하는 고대의 존재. 규칙을 어긴 자를 추적한다.',
    aiSummary: '규칙을 지키는 시간의 관리자',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-02')
  }
]

// 아이템 리소스
export const mockItemResources: Resource[] = [
  {
    id: 'i1',
    type: 'item',
    name: '은빛 열쇠',
    tags: ['중요', '마법'],
    description: '달빛으로 만들어진 신비한 열쇠. 숨겨진 문을 열 수 있다.',
    aiSummary: '달빛으로 만들어진 마법 열쇠',
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-02-06')
  },
  {
    id: 'i2',
    type: 'item',
    name: '시간의 모래시계',
    tags: ['위험', '금지'],
    description: '시간을 되돌릴 수 있는 금지된 유물. 사용 시 대가가 따른다.',
    aiSummary: '시간을 되돌리는 금지된 유물',
    createdAt: new Date('2026-01-22'),
    updatedAt: new Date('2026-01-30')
  }
]

// 플롯 리소스
export const mockPlotResources: Resource[] = [
  {
    id: 'p1',
    type: 'plot',
    name: '첫 만남',
    tags: ['도입부', '완료'],
    description: '서재에서 주인공과 미스터리한 방문자가 처음 만난다.',
    aiSummary: '주인공과 방문자의 운명적 첫 만남',
    createdAt: new Date('2026-01-12'),
    updatedAt: new Date('2026-02-05')
  },
  {
    id: 'p2',
    type: 'plot',
    name: '은빛 열쇠의 발견',
    tags: ['전개', '진행중'],
    description: '서재 깊숙한 곳에서 은빛 열쇠를 발견하고 그 비밀을 알게 된다.',
    aiSummary: '숨겨진 열쇠의 발견과 비밀의 시작',
    createdAt: new Date('2026-01-28'),
    updatedAt: new Date('2026-02-06')
  },
  {
    id: 'p3',
    type: 'plot',
    name: '시간의 수호자 등장',
    tags: ['위기', '계획'],
    description: '금기를 어긴 대가로 시간의 수호자가 나타나 주인공을 추적한다.',
    aiSummary: '시간의 수호자 등장으로 인한 위기',
    createdAt: new Date('2026-02-03'),
    updatedAt: new Date('2026-02-04')
  }
]

// 모든 리소스
export const getAllResources = (): Resource[] => {
  return [
    ...mockWorldResources,
    ...mockCharacterResources,
    ...mockItemResources,
    ...mockPlotResources
  ]
}

// 타입별 리소스 가져오기
export const getResourcesByType = (type: ResourceType): Resource[] => {
  return getAllResources().filter(r => r.type === type)
}

// 리소스 아이콘 맵
export const resourceIconMap = {
  world: '🌍',
  character: '👤',
  item: '💎',
  plot: '📖'
}

// 리소스 타입 레이블
export const resourceLabelMap = {
  world: '세계관',
  character: '인물',
  item: '아이템',
  plot: '플롯'
}
