const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType
} = require('docx')
const PptxGenJS = require('pptxgenjs')

function h(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } })
}
function p(text) {
  return new Paragraph({ children: [new TextRun({ text, size: 22 })], spacing: { after: 100 } })
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } })
}

function courseSections(content) {
  const sections = []
  sections.push(h('一、学习目标', HeadingLevel.HEADING_2))
  ;(content.objectives || []).forEach((o) => sections.push(bullet(o)))

  sections.push(h('二、价值观解读', HeadingLevel.HEADING_2))
  sections.push(p(content.value_interpretation || ''))

  sections.push(h('三、流程节点说明', HeadingLevel.HEADING_2))
  sections.push(p(content.node_intro || ''))

  sections.push(h('四、企业阶段适配说明', HeadingLevel.HEADING_2))
  sections.push(p(content.stage_note || ''))

  sections.push(h('五、具体行动清单', HeadingLevel.HEADING_2))
  ;(content.actions || []).forEach((a) => {
    sections.push(new Paragraph({
      children: [
        new TextRun({ text: `${a.index}. ${a.action}`, bold: true, size: 22 }),
        new TextRun({ text: a.assessment ? `\n   评估标准：${a.assessment}` : '', size: 20 })
      ],
      spacing: { after: 100 }
    }))
  })

  sections.push(h('六、正面案例', HeadingLevel.HEADING_2))
  sections.push(p(content.positive_case || ''))

  sections.push(h('七、反面案例', HeadingLevel.HEADING_2))
  sections.push(p(content.negative_case || ''))

  sections.push(h('八、讨论题', HeadingLevel.HEADING_2))
  ;(content.discussion || []).forEach((d, i) => sections.push(bullet(`${i + 1}. ${d}`)))

  sections.push(h('九、角色扮演脚本', HeadingLevel.HEADING_2))
  if (content.roleplay) {
    sections.push(p(`演练名称：${content.roleplay.title || ''}`))
    ;(content.roleplay.roles || []).forEach((r) => sections.push(bullet(r)))
    sections.push(p(`场景：${content.roleplay.scene || ''}`))
    sections.push(p(`目标：${content.roleplay.goal || ''}`))
  }

  sections.push(h('十、考核点', HeadingLevel.HEADING_2))
  ;(content.assessment || []).forEach((a, i) =>
    sections.push(bullet(`${i + 1}. ${a.point || a}${a.standard ? `（标准：${a.standard}）` : ''}`))
  )
  return sections
}

async function courseToDocx(content) {
  const children = [
    new Paragraph({
      children: [new TextRun({ text: content.title || '培训课件', bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 }
    })
  ]
  children.push(...courseSections(content))
  const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: {
      paragraph: { run: { font: 'Microsoft YaHei' } }
    }
  })
  return Packer.toBuffer(doc)
}

async function coursesToDocx(list) {
  const children = []
  list.forEach((content, idx) => {
    if (idx > 0) {
      children.push(new Paragraph({ text: '', pageBreakBefore: true }))
    }
    children.push(
      new Paragraph({
        children: [new TextRun({ text: content.title || `课件 ${idx + 1}`, bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 }
      })
    )
    children.push(...courseSections(content))
  })
  const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: { paragraph: { run: { font: 'Microsoft YaHei' } } }
  })
  return Packer.toBuffer(doc)
}

function addBullets(slide, items, colors) {
  if (!items || !items.length) return
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })),
    { x: 0.6, y: 1.5, w: 9, h: 4, fontSize: 18, color: colors || '333333' }
  )
}

async function courseToPptx(content) {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'

  const title = pptx.addSlide()
  title.background = { color: '1F3A93' }
  title.addText(content.title || '培训课件', {
    x: 0.5,
    y: 2.2,
    w: 12,
    h: 1.5,
    fontSize: 34,
    bold: true,
    color: 'FFFFFF',
    align: 'center'
  })
  title.addText('Culture2Action 文化落地引擎 自动生成', {
    x: 0.5,
    y: 3.8,
    w: 12,
    h: 0.6,
    fontSize: 16,
    color: 'AFC3E8',
    align: 'center'
  })

  const slides = [
    ['学习目标', content.objectives],
    ['价值观解读', [content.value_interpretation]],
    ['流程节点说明', [content.node_intro]],
    ['企业阶段适配说明', [content.stage_note]],
    ['具体行动清单', (content.actions || []).map((a) => `${a.index}. ${a.action}`)],
    ['正面案例', [content.positive_case]],
    ['反面案例', [content.negative_case]],
    ['讨论题', content.discussion],
    [
      '角色扮演脚本',
      content.roleplay
        ? [...(content.roleplay.roles || []), `场景：${content.roleplay.scene}`, `目标：${content.roleplay.goal}`]
        : []
    ],
    ['考核点', (content.assessment || []).map((a, i) => `${i + 1}. ${a.point || a}`)]
  ]

  slides.forEach(([titleText, items]) => {
    const slide = pptx.addSlide()
    slide.addText(titleText, {
      x: 0.5,
      y: 0.4,
      w: 12,
      h: 0.8,
      fontSize: 26,
      bold: true,
      color: '1F3A93'
    })
    addBullets(slide, items)
  })

  return pptx.write({ outputType: 'nodebuffer' })
}

module.exports = { courseToDocx, coursesToDocx, courseToPptx }
