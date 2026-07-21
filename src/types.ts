// Define interfaces matching backend schemas

export interface SelectedEncounter {
  patient_name?: string
  age?: string
  age_years?: string
  dob?: string
  date_of_birth?: string
  patient_dob?: string
  birth_date?: string
  phy_name?: string
  physician_name?: string
  doctor_name?: string
  app_date_time?: string
  appointment_start_time?: string
  enc_date?: string
  appointment_date?: string
  start_date?: string
  arrived_date?: string
  display_encounter_configno?: string
  gender?: string
  temperature?: string
}

export interface Attachment {
  reportedDate?: string
  name?: string
  uploadedBy?: string
  uploadedOn?: string
  encounter?: string
  category?: string
  downloadUrl?: string
}

export interface PatientHistoricFile {
  name?: string
  fileType?: string
  patientId?: any
  siteId?: any
  serverPath?: string
  downloadUrl?: string
}

export interface SummaryResult {
  encounterInput?: string
  selected?: SelectedEncounter
  attachments?: Attachment[]
  patientHistoricFiles?: PatientHistoricFile[]
  summaryHtml: string
}

export interface RcmActivity {
  _encounter?: string
  code?: string
  order_name?: string
  total_rej_amount?: any
  ra_net_payable?: any
  total_ra_amount?: any
  derived_ra_status?: string
  derived_prior_auth?: string
  claim_denial_code?: string
  claim_auth_status?: any
  status?: string
  claim_status?: string
  activity_status?: string
  authIdPayer?: string
  auth_date?: any
  auth_item_date?: any
  authorization_date?: any
  prior_auth_date_time?: any
  prior_auth_denial_date_time?: any
  activity_conducted_edit_date?: any
  order_type_desc?: string
  code_id?: any
  claim_qty?: any
  claim_quantity?: any
  claim_net_pay?: any
  claim_net_payable?: any
  claim_patient_pay?: any
  claim_payer_pay?: any
  ra_qty?: any
  ra_pat_payable?: any
  ra_payer_payable?: any
  comments?: string
  refusal_for_auth_reason?: string
  claim_denial_desc?: string
  repeatTrackerBillingSummary?: string
  order_authorization_id?: any
  activity_status_id?: any
  payer_auth_id?: string
  auth_number?: string
  authorization_number?: string
  claimAuthNumber?: string
  write_off_amount?: any
  is_checked_for_resubmition?: any
  marked_for_resubmition?: any
  pending_for_write_off?: any
  maked_for_write_off?: any
  marked_closed?: any
  isClosed?: any
}

export interface RcmVisit {
  _source_encounter?: string
  display_encounter?: string
  appointment_status?: string
  start_date?: string
  actual_encounter_start_date?: string
  phy_name?: string
  payer_type?: string
  payer_pay?: any
  patient_payable?: any
  receipt_total?: any
  totol_refund?: any
  balance_due?: any
}

export interface RcmHistory {
  _encounter?: string
  file_name?: string
  transact_date?: string
  payment_ref?: string
  idPayer?: string
  ra_id_payer?: string
  code?: string
  itemName?: string
  item_name?: string
  denialCode?: string
  ra_denial_code?: string
  ra_payer_credit?: any
  auth_payer_payable?: any
  ra_claim_comment?: string
  claim_denial_desc?: string
  file_id?: any
  ra_file_id?: any
  site_id?: any
}

export interface RcmRemark {
  _encounter?: string
  remarks_from?: string
  status_id?: any
  remarks_ra?: string
  remarks_write_off?: string
  remarks_resub?: string
  remarks_pat_pay_ar?: string
  remarks?: string
  user_name?: string
  remarks_date?: string
}

export interface RcmResubmission {
  _encounter?: string
  source?: string
  type?: string
  ra_file_name?: string
  reason?: string
  ra_claim_comment?: string
  remarks_resub?: string
  remarks?: string
  note?: string
  comments?: string
  user_name?: string
  captured_on?: string
  payment_ref?: string
  file_id?: any
  site_id?: any
}

export interface RcmData {
  flattened?: {
    activity?: RcmActivity[]
    visit?: RcmVisit[]
    history?: RcmHistory[]
    remarks?: RcmRemark[]
    resubmissions?: RcmResubmission[]
  }
  detail?: {
    claimHistory?: any[]
  }
  writeContext?: {
    canSaveResubmission?: boolean
    canSaveRaRemarks?: boolean
    resubmitReasonId?: number
    existingReason?: {
      type?: any
      fileId?: any
      fileName?: string
      comments?: string
    }
  }
  errors?: any[]
}

export interface RcmResult {
  rcm?: RcmData
  warnings?: any
}

export interface SubmissionFileResponse {
  pdfBase64?: string
  content?: string
}

export type Tab =
  | 'summary'
  | 'activity'
  | 'visit'
  | 'history'
  | 'results'
  | 'historic'
  | 'storage'
  | 'logs'
  | 'settings'
  | 'icdedits'
  | 'bulkxml'
  | 'bulkresub'
  | 'bypass'
  | 'observations'
  | 'prompt'
  | 'api'
  | 'bulkmnec'
  | 'raexcel'
  | 'bulk'
  | 'workshop'
  | 'afm'

export interface FewShotExample {
  input: string
  demographics: string
  complaints: string
  hpi: string
  diagnoses?: string
  output: string
  deniedCodesDescription?: string
  enabled?: boolean
}
