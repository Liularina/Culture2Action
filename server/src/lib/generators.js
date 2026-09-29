const { STAGE_META } = require('./stage')

const DIM_CONFIG = {
  倾听: { focus: '客户真实需求与痛点', method: '开放式问题与非语言观察', artifact: '客户需求清单', conflict: '坚持用客户事实说话' },
  共情: { focus: '客户在使用场景中的真实感受', method: '用户旅程与场景还原', artifact: '客户情绪触点清单', conflict: '站在客户角度还原真实体验' },
  响应: { focus: '客户问题的响应时效', method: '问题分级与闭环跟踪', artifact: '问题闭环台账', conflict: '优先保障客户问题的闭环' },
  超越: { focus: '客户未被满足的期望', method: '超出预期的方案设计', artifact: '超预期服务清单', conflict: '在规则内为客户多争取一步' },
  长期: { focus: '客户长期价值', method: '生命周期与复购分析', artifact: '客户长期价值档案', conflict: '为长期信任放弃短期成交' },
  好奇: { focus: '行业与用户的新变化', method: '趋势扫描与一线走访', artifact: '机会清单', conflict: '保持对新事物的敏感与试错' },
  试错: { focus: '低成本验证关键假设', method: '小步实验与快速复盘', artifact: '实验记录', conflict: '允许在可控范围内快速失败' },
  迭代: { focus: '现有做法的改进点', method: '小步快跑与版本迭代', artifact: '迭代计划', conflict: '用改进而不是重来解决问题' },
  突破: { focus: '现有做法的边界', method: '挑战假设与重新设计', artifact: '突破方案', conflict: '敢于挑战不合理的惯例' },
  言行一致: { focus: '承诺与行动的一致性', method: '承诺台账与兑现跟踪', artifact: '承诺兑现台账', conflict: '说到的必须做到' },
  透明: { focus: '关键信息的公开透明', method: '信息同步与问题暴露', artifact: '信息同步清单', conflict: '主动暴露问题而不隐瞒' },
  守诺: { focus: '对客户与同事的承诺', method: '承诺分级与到期提醒', artifact: '承诺清单', conflict: '按时兑现每一个承诺' },
  担当: { focus: '问题责任的归属', method: '责任到人与复盘纠偏', artifact: '问题责任清单', conflict: '先担责再解决问题' },
  补位: { focus: '团队协作中的缺口', method: '缺口识别与主动补位', artifact: '补位记录', conflict: '看到缺口先补上' },
  沟通: { focus: '协作中的信息差', method: '主动同步与对齐会议', artifact: '信息同步记录', conflict: '主动沟通而不是等待' },
  共享: { focus: '资源与经验的共享', method: '知识沉淀与复用', artifact: '知识共享库', conflict: '共享经验帮助他人' },
  共赢: { focus: '整体利益最大化', method: '全局视角与联合目标', artifact: '协同目标表', conflict: '以整体结果为先' },
  目标: { focus: '目标的可执行拆解', method: '目标分解与责任到人', artifact: '目标拆解表', conflict: '围绕目标推进而不偏离' },
  效率: { focus: '资源投入产出比', method: '流程优化与工具提效', artifact: '效率改进清单', conflict: '用更少资源达成结果' },
  复盘: { focus: '结果背后的原因', method: '结构化复盘方法', artifact: '复盘报告', conflict: '用事实复盘而不找借口' },
  交付: { focus: '承诺的交付结果', method: '里程碑与风险预警', artifact: '交付里程碑表', conflict: '按时按质交付' },
  主动: { focus: '未被安排但重要的事', method: '主动发现与承担', artifact: '主动任务清单', conflict: '不等安排主动出手' },
  节约: { focus: '资源浪费点', method: '成本意识与浪费排查', artifact: '降本清单', conflict: '像花自己的钱一样花公司的钱' },
  长期主义: { focus: '长期价值与短期取舍', method: '长期目标与阶段投入', artifact: '长期投入计划', conflict: '为长期价值忍受短期压力' },
  开放: { focus: '新观点与新方式', method: '开放讨论与多元输入', artifact: '观点清单', conflict: '先接纳再判断' },
  适应: { focus: '变化带来的调整点', method: '快速调整与心态管理', artifact: '调整清单', conflict: '快速切换到新要求' },
  学习: { focus: '能力差距', method: '刻意练习与知识更新', artifact: '学习计划', conflict: '把学习当成工作的一部分' },
  引领: { focus: '变化中的主动权', method: '主动推动与示范', artifact: '变革推进表', conflict: '主动拥抱并推动变化' },
  标准: { focus: '当前标准与更高标准', method: '对标与标准升级', artifact: '标准清单', conflict: '不满足于及格线' },
  精进: { focus: '专业能力短板', method: '专项打磨与同行对标', artifact: '能力精进计划', conflict: '持续打磨专业能力' },
  细节: { focus: '影响体验的关键细节', method: '细节清单与检查机制', artifact: '细节检查表', conflict: '关键细节不放过' },
  极致: { focus: '关键环节的最优解', method: '极致打磨与迭代', artifact: '极致标准表', conflict: '在关键处做到最好' },
  节约资源: { focus: '公司资源的浪费点', method: '成本排查与制度约束', artifact: '降本增效清单', conflict: '主动制止浪费行为' },
  维护声誉: { focus: '公司内外的形象', method: '统一口径与正面传播', artifact: '声誉维护清单', conflict: '主动维护公司形象' },
  补位协作: { focus: '跨部门协作缺口', method: '主动补位与协同推进', artifact: '协作补位台账', conflict: '不推诿、主动补位' },
  培养他人: { focus: '团队成员的成长', method: '带教与经验分享', artifact: '人才培养计划', conflict: '愿意花时间培养他人' },
  长期利益: { focus: '公司长期利益', method: '长期决策与取舍', artifact: '长期决策记录', conflict: '把公司长期利益放在前面' },
  合规: { focus: '法律与道德底线', method: '合规审查与红线清单', artifact: '合规红线清单', conflict: '守住底线不越界' },
  环保: { focus: '资源消耗与环境影响', method: '绿色运营与减废', artifact: '环保改进清单', conflict: '减少浪费与排放' },
  公益: { focus: '社会与社区需求', method: '公益项目与志愿参与', artifact: '公益行动记录', conflict: '主动承担社会责任' },
  员工关怀: { focus: '员工身心健康与成长', method: '关怀机制与沟通', artifact: '员工关怀清单', conflict: '把员工当伙伴' }
}

function dimConfig(dimension, description) {
  return (
    DIM_CONFIG[dimension] || {
      focus: description || `与“${dimension}”相关的关键行为`,
      method: '结构化方法与真实数据',
      artifact: `${dimension}行动清单`,
      conflict: `坚持“${dimension}”原则，不因短期压力妥协`
    }
  )
}

const ACTOR = {
  S1: '创始人或负责人亲自',
  S2: '业务负责人牵头',
  S3: '专业团队按机制',
  S4: '跨业务单元协同'
}
const STAGE_BEHAVIOR = {
  S1: '以最基础、最具体的行为要求为先，不挑活、快速响应',
  S2: '建立可复制的流程和机制，明确责任人与完成时限',
  S3: '用数据和体系驱动，形成标准并沉淀为组织能力',
  S4: '从组织和战略层面对齐，推动跨业务与生态协同'
}
const REVIEW = {
  S1: '每周晨会快速对齐',
  S2: '每月复盘会检查进展',
  S3: '每季度做体系化评审',
  S4: '半年度做组织级回顾'
}

function buildActionsForDimension({ value, dimension, dimDescription, nodes, stage, industry }) {
  const cfg = dimConfig(dimension, dimDescription)
  const actor = ACTOR[stage] || ACTOR.S2
  const behavior = STAGE_BEHAVIOR[stage] || STAGE_BEHAVIOR.S2
  const review = REVIEW[stage] || REVIEW.S2
  const stageMeta = STAGE_META[stage] || STAGE_META.S2
  const result = []

  nodes.forEach((node) => {
    const base = `「${node.name}」`
    const items = [
      {
        action: `在${base}环节，${actor}采用${cfg.method}，围绕${cfg.focus}收集信息，并输出${cfg.artifact}。`,
        assessment: `能提交 1 份${cfg.artifact}，其中与“${dimension}”相关的条目不少于 3 条`,
        case: `某${industry}企业${stageMeta.name}在${base}环节通过${cfg.method}，第一次把“${dimension}”变成了可检查的动作。`
      },
      {
        action: `在${base}环节，识别至少 3 个${cfg.focus}相关的关键问题，明确责任人和完成时限。`,
        assessment: `问题清单责任到人，完成时限明确，闭环率≥80%`,
        case: `某${industry}企业把${base}环节的问题列成清单，责任到人后，推进效率明显提升。`
      },
      {
        action: `在${base}环节，结合本阶段要求（${behavior}），把“${dimension}”转化为可执行动作并落地。`,
        assessment: `动作与${stageMeta.name}要求匹配，能在日常工作中被观察到`,
        case: `某${industry}企业${stageMeta.name}把“${dimension}”写进${base}的标准动作，新人也能照着做。`
      },
      {
        action: `在${base}环节，当“${dimension}”与短期目标冲突时，${cfg.conflict}。`,
        assessment: `出现冲突时有明确处理记录，且未违背“${dimension}”底线`,
        case: `某${industry}企业在${base}环节顶住短期压力坚持“${dimension}”，最终赢得客户/同事长期信任。`
      },
      {
        action: `在${base}环节，${review}，复盘“${dimension}”落地情况并输出改进记录。`,
        assessment: `有复盘记录，且至少提出 1 条可执行的改进措施`,
        case: `某${industry}企业通过持续复盘，把“${dimension}”从一次活动变成了长期习惯。`
      }
    ]
    result.push({
      value,
      dimension,
      node: node.name,
      node_id: node.id,
      stage,
      actions: items
    })
  })
  return result
}

function generateActions(input) {
  const { value, dimensions, nodes, stage, industry } = input
  const output = []
  dimensions.forEach((dim) => {
    const dimName = typeof dim === 'string' ? dim : dim.name
    const dimDesc = typeof dim === 'string' ? '' : dim.description
    output.push(
      ...buildActionsForDimension({
        value,
        dimension: dimName,
        dimDescription: dimDesc,
        nodes,
        stage,
        industry
      })
    )
  })
  return output
}

function generateCourse({ value, dimension, dimensionDescription, node, stage, actions, industry, processName }) {
  const stageMeta = STAGE_META[stage] || STAGE_META.S2
  const actionTexts = actions.map((a) => (typeof a === 'string' ? a : a.action))
  const actionItems = actions.map((a, i) => ({
    index: i + 1,
    action: typeof a === 'string' ? a : a.action,
    assessment: typeof a === 'string' ? '' : a.assessment,
    training_case: typeof a === 'string' ? '' : a.training_case
  }))
  const cfg = dimConfig(dimension, dimensionDescription)

  return {
    title: `${value}之${dimension}：${node.name}怎么做才算真正落地（${stage}${stageMeta.name}版）`,
    objectives: [
      `能说出“${dimension}”在${node.name}环节的具体标准`,
      `能在${node.name}环节完成至少 3 个可观察的“${dimension}”动作`,
      `能识别并纠正与“${dimension}”相违背的常见做法`
    ],
    value_interpretation: `“${dimension}”的核心是${dimensionDescription || cfg.focus}。放到${node.name}环节，它意味着：${cfg.focus}，并用${cfg.method}把它固定下来。`,
    node_intro: `${node.name}是${processName || '业务流程'}中的关键节点，主要工作是${node.description || '完成本环节的任务'}。`,
    stage_note: `${stage} ${stageMeta.name}（${stageMeta.size}，${stageMeta.years}）：${stageMeta.tone}。在本阶段，${dimension}的行为标准应体现为：${stageMeta.behaviors}。`,
    actions: actionItems,
    positive_case: actionItems[0]?.training_case || `某${industry}企业在${node.name}环节坚持“${dimension}”，取得了明显效果。`,
    negative_case: `某${industry}企业在${node.name}环节把“${dimension}”当成口号：只开会强调，没有具体动作、没有责任人、没有检查。结果是员工依旧按老习惯做事，问题反复出现，最终“${dimension}”停留在墙上。`,
    discussion: [
      `在${node.name}环节，“${dimension}”最容易被打折扣的地方在哪里？为什么？`,
      `如果资源有限，你会优先做哪 1 个动作？判断依据是什么？`,
      `你身边有哪些“说了但没做”的${dimension}例子？可以怎么纠正？`
    ],
    roleplay: {
      title: `${node.name}环节的${dimension}实战演练`,
      roles: [
        `角色A：${node.name}环节负责人，负责推动“${dimension}”落地`,
        `角色B：一线执行者，面临时间紧、任务重、习惯难改的压力`
      ],
      scene: `在${node.name}环节，A 需要推动一个与“${dimension}”相关的关键动作，B 认为没必要、太麻烦。`,
      goal: `A 在 5 分钟内让 B 认同并承诺执行 1 个具体动作，明确责任人和完成时限。`
    },
    assessment: actionItems.slice(0, 3).map((a, i) => ({
      point: `考核点 ${i + 1}：${a.assessment || `能完成“${a.action.slice(0, 20)}…”相关动作`}`,
      standard: '能在现场演练中完成，并说明判断依据'
    }))
  }
}

function adaptActionText(action, targetIndustry, targetNode, stage) {
  const stageMeta = STAGE_META[stage] || STAGE_META.S2
  return `${action}（已按${targetIndustry}·${targetNode}·${stage}${stageMeta.name}适配）`
}

module.exports = { generateActions, generateCourse, dimConfig, adaptActionText }
