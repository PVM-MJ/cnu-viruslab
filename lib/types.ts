export type MeetingStatus = 'scheduled' | 'completed'
export type ExperimentStatus = 'planned' | 'in_progress' | 'completed' | 'paused'
export type SampleStage = 'collected' | 'dna_extraction' | 'sequencing' | 'analysis' | 'completed'

export interface LabMeeting {
  id: string
  date: string
  presenter: string
  title: string
  content: string | null
  decisions: string | null
  next_meeting: string | null
  created_by: string | null
  created_at: string
}

export interface Experiment {
  id: string
  researcher: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: ExperimentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Sample {
  id: string
  sample_id: string
  type: string
  source: string | null
  collection_date: string | null
  stage: SampleStage
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Reagent {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  expiry_date: string | null
  location: string | null
  needs_order: boolean
  notes: string | null
  updated_at: string
}
