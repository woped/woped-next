import type { HelpTooltipDef } from '@/types/help'

export const helpTooltips: Record<string, HelpTooltipDef> = {
  properties: {
    id: 'properties',
    titleKey: 'help.tooltips.properties.title',
    contentKey: 'help.tooltips.properties.content',
    articleId: 'editor-tools',
  },
  tokenGame: {
    id: 'tokenGame',
    titleKey: 'help.tooltips.tokenGame.title',
    contentKey: 'help.tooltips.tokenGame.content',
    articleId: 'token-game-basics',
  },
  analysis: {
    id: 'analysis',
    titleKey: 'help.tooltips.analysis.title',
    contentKey: 'help.tooltips.analysis.content',
    articleId: 'analysis-overview',
  },
  simulation: {
    id: 'simulation',
    titleKey: 'help.tooltips.simulation.title',
    contentKey: 'help.tooltips.simulation.content',
    articleId: 'simulation-overview',
  },
  places: {
    id: 'places',
    titleKey: 'help.tooltips.places.title',
    contentKey: 'help.tooltips.places.content',
    articleId: 'petri-net-basics',
  },
  transitions: {
    id: 'transitions',
    titleKey: 'help.tooltips.transitions.title',
    contentKey: 'help.tooltips.transitions.content',
    articleId: 'petri-net-basics',
  },
  operators: {
    id: 'operators',
    titleKey: 'help.tooltips.operators.title',
    contentKey: 'help.tooltips.operators.content',
    articleId: 'operators-overview',
  },
  arcRouting: {
    id: 'arcRouting',
    titleKey: 'help.tooltips.arcRouting.title',
    contentKey: 'help.tooltips.arcRouting.content',
    articleId: 'arcs-routing',
  },
  conflictResolution: {
    id: 'conflictResolution',
    titleKey: 'help.tooltips.conflictResolution.title',
    contentKey: 'help.tooltips.conflictResolution.content',
    articleId: 'token-game-conflicts',
  },
  coverabilityGraph: {
    id: 'coverabilityGraph',
    titleKey: 'help.tooltips.coverabilityGraph.title',
    contentKey: 'help.tooltips.coverabilityGraph.content',
    articleId: 'analysis-coverability',
  },
  timeModel: {
    id: 'timeModel',
    titleKey: 'help.tooltips.timeModel.title',
    contentKey: 'help.tooltips.timeModel.content',
    articleId: 'simulation-time-models',
  },
  resources: {
    id: 'resources',
    titleKey: 'help.tooltips.resources.title',
    contentKey: 'help.tooltips.resources.content',
    articleId: 'simulation-resources',
  },
}
