
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admin_audit_log": {
                  Row: {
                    "action": string,"admin_id": string | null,"created_at": string,"id": string,"target": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"admin_id"?: string | null,"created_at"?: string,"id"?: string,"target"?: string | null
                  }
                  Update: {
                    "action"?: string,"admin_id"?: string | null,"created_at"?: string,"id"?: string,"target"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_audit_log_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"care_templates": {
                  Row: {
                    "care_type": Database["public"]['Enums']["care_type"],"description": string,"items": NonNullable<Json>,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "care_type": Database["public"]['Enums']["care_type"],"description": string,"items"?: NonNullable<Json>,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "care_type"?: Database["public"]['Enums']["care_type"],"description"?: string,"items"?: NonNullable<Json>,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"cared_links": {
                  Row: {
                    "circle_id": string,"created_at": string,"created_by": string,"expires_at": string,"id": string,"label": string | null,"last_used_at": string | null,"revoked_at": string | null,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"created_at"?: string,"created_by": string,"expires_at": string,"id"?: string,"label"?: string | null,"last_used_at"?: string | null,"revoked_at"?: string | null,"token_hash": string
                  }
                  Update: {
                    "circle_id"?: string,"created_at"?: string,"created_by"?: string,"expires_at"?: string,"id"?: string,"label"?: string | null,"last_used_at"?: string | null,"revoked_at"?: string | null,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cared_links_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cared_links_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"circle_members": {
                  Row: {
                    "circle_id": string,"created_at": string,"display_name": string,"notify_kinds": (string)[],"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"created_at"?: string,"display_name": string,"notify_kinds"?: (string)[],"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "circle_id"?: string,"created_at"?: string,"display_name"?: string,"notify_kinds"?: (string)[],"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "circle_members_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "circle_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"circles": {
                  Row: {
                    "care_type": Database["public"]['Enums']["care_type"],"cared_name": string,"closed_at": string | null,"closed_reason": string | null,"created_at": string,"created_by": string,"id": string,"relation": string,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "care_type": Database["public"]['Enums']["care_type"],"cared_name": string,"closed_at"?: string | null,"closed_reason"?: string | null,"created_at"?: string,"created_by": string,"id"?: string,"relation": string,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "care_type"?: Database["public"]['Enums']["care_type"],"cared_name"?: string,"closed_at"?: string | null,"closed_reason"?: string | null,"created_at"?: string,"created_by"?: string,"id"?: string,"relation"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "circles_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "created_at": string,"granted": boolean,"id": string,"layer": Database["public"]['Enums']["consent_layer"],"user_id": string,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"granted": boolean,"id"?: string,"layer": Database["public"]['Enums']["consent_layer"],"user_id": string,"version": string
                  }
                  Update: {
                    "created_at"?: string,"granted"?: boolean,"id"?: string,"layer"?: Database["public"]['Enums']["consent_layer"],"user_id"?: string,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"contacts": {
                  Row: {
                    "circle_id": string,"created_at": string,"id": string,"is_emergency": boolean,"kind": string,"name": string,"notes_enc": string | null,"phone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"created_at"?: string,"id"?: string,"is_emergency"?: boolean,"kind": string,"name": string,"notes_enc"?: string | null,"phone": string,"updated_at"?: string
                  }
                  Update: {
                    "circle_id"?: string,"created_at"?: string,"id"?: string,"is_emergency"?: boolean,"kind"?: string,"name"?: string,"notes_enc"?: string | null,"phone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contacts_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    }
                  ]
                },"emergency_events": {
                  Row: {
                    "circle_id": string,"id": string,"link_id": string | null,"recipients": number,"triggered_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"id"?: string,"link_id"?: string | null,"recipients"?: number,"triggered_at"?: string
                  }
                  Update: {
                    "circle_id"?: string,"id"?: string,"link_id"?: string | null,"recipients"?: number,"triggered_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "emergency_events_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "emergency_events_link_id_fkey"
      columns: ["link_id"]
isOneToOne: false
      referencedRelation: "cared_links"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"org_code": string | null,"props": NonNullable<Json>,"pseudonym_id": string,"technical": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"org_code"?: string | null,"props"?: NonNullable<Json>,"pseudonym_id": string,"technical"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"org_code"?: string | null,"props"?: NonNullable<Json>,"pseudonym_id"?: string,"technical"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"fake_door_interest": {
                  Row: {
                    "choice": string | null,"created_at": string,"door_key": string,"id": string,"notify_me": boolean,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "choice"?: string | null,"created_at"?: string,"door_key": string,"id"?: string,"notify_me"?: boolean,"user_id": string
                  }
                  Update: {
                    "choice"?: string | null,"created_at"?: string,"door_key"?: string,"id"?: string,"notify_me"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fake_door_interest_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"feedback": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"message": string,"read_at": string | null,"screen": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"message": string,"read_at"?: string | null,"screen"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"message"?: string,"read_at"?: string | null,"screen"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "feedback_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invitations": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"circle_id": string,"created_at": string,"created_by": string,"expires_at": string,"id": string,"revoked_at": string | null,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"circle_id": string,"created_at"?: string,"created_by": string,"expires_at": string,"id"?: string,"revoked_at"?: string | null,"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"circle_id"?: string,"created_at"?: string,"created_by"?: string,"expires_at"?: string,"id"?: string,"revoked_at"?: string | null,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_accepted_by_fkey"
      columns: ["accepted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"journal_entries": {
                  Row: {
                    "author_id": string,"circle_id": string,"created_at": string,"day_rating": string,"entry_date": string,"food": string | null,"id": string,"moods": (string)[],"note_enc": string | null,"sleep": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"circle_id": string,"created_at"?: string,"day_rating": string,"entry_date": string,"food"?: string | null,"id"?: string,"moods"?: (string)[],"note_enc"?: string | null,"sleep"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"circle_id"?: string,"created_at"?: string,"day_rating"?: string,"entry_date"?: string,"food"?: string | null,"id"?: string,"moods"?: (string)[],"note_enc"?: string | null,"sleep"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "journal_entries_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "journal_entries_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    }
                  ]
                },"occurrence_marks": {
                  Row: {
                    "circle_id": string,"created_at": string,"idempotency_key": string,"marked_by": string | null,"occurrence_id": string,"status": Database["public"]['Enums']["occurrence_status"],"via": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"created_at"?: string,"idempotency_key": string,"marked_by"?: string | null,"occurrence_id": string,"status": Database["public"]['Enums']["occurrence_status"],"via": string
                  }
                  Update: {
                    "circle_id"?: string,"created_at"?: string,"idempotency_key"?: string,"marked_by"?: string | null,"occurrence_id"?: string,"status"?: Database["public"]['Enums']["occurrence_status"],"via"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "occurrence_marks_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "occurrence_marks_marked_by_fkey"
      columns: ["marked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "occurrence_marks_occurrence_id_fkey"
      columns: ["occurrence_id"]
isOneToOne: false
      referencedRelation: "reminder_occurrences"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "active": boolean,"code": string,"created_at": string,"dashboard_token_hash": string | null,"id": string,"kind": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"code": string,"created_at"?: string,"dashboard_token_hash"?: string | null,"id"?: string,"kind": string,"name": string
                  }
                  Update: {
                    "active"?: boolean,"code"?: string,"created_at"?: string,"dashboard_token_hash"?: string | null,"id"?: string,"kind"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"deactivated_at": string | null,"deletion_requested_at": string | null,"display_name": string | null,"followup_minutes": number,"id": string,"inactivity_notice_sent_at": string | null,"is_admin": boolean,"journal_reminder_time": string | null,"last_active_at": string,"onboarding_completed_at": string | null,"org_code": string | null,"pseudonym_id": string,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deactivated_at"?: string | null,"deletion_requested_at"?: string | null,"display_name"?: string | null,"followup_minutes"?: number,"id": string,"inactivity_notice_sent_at"?: string | null,"is_admin"?: boolean,"journal_reminder_time"?: string | null,"last_active_at"?: string,"onboarding_completed_at"?: string | null,"org_code"?: string | null,"pseudonym_id"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deactivated_at"?: string | null,"deletion_requested_at"?: string | null,"display_name"?: string | null,"followup_minutes"?: number,"id"?: string,"inactivity_notice_sent_at"?: string | null,"is_admin"?: boolean,"journal_reminder_time"?: string | null,"last_active_at"?: string,"onboarding_completed_at"?: string | null,"org_code"?: string | null,"pseudonym_id"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_org_code_fkey"
      columns: ["org_code"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["code"]
    }
                  ]
                },"push_subscriptions": {
                  Row: {
                    "auth": string,"created_at": string,"endpoint": string,"failed_count": number,"id": string,"last_success_at": string | null,"p256dh": string,"user_agent": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth": string,"created_at"?: string,"endpoint": string,"failed_count"?: number,"id"?: string,"last_success_at"?: string | null,"p256dh": string,"user_agent"?: string | null,"user_id": string
                  }
                  Update: {
                    "auth"?: string,"created_at"?: string,"endpoint"?: string,"failed_count"?: number,"id"?: string,"last_success_at"?: string | null,"p256dh"?: string,"user_agent"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_subscriptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reminder_occurrences": {
                  Row: {
                    "advance_days": number,"circle_id": string,"created_at": string,"done_at": string | null,"done_by": string | null,"done_via": string | null,"due_at": string,"event_at": string,"followup_sent_at": string | null,"id": string,"kind": Database["public"]['Enums']["occurrence_kind"],"local_date": string,"not_done_reason": string | null,"notified_at": string | null,"reminder_id": string,"snoozed_until": string | null,"status": Database["public"]['Enums']["occurrence_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "advance_days"?: number,"circle_id": string,"created_at"?: string,"done_at"?: string | null,"done_by"?: string | null,"done_via"?: string | null,"due_at": string,"event_at": string,"followup_sent_at"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["occurrence_kind"],"local_date": string,"not_done_reason"?: string | null,"notified_at"?: string | null,"reminder_id": string,"snoozed_until"?: string | null,"status"?: Database["public"]['Enums']["occurrence_status"]
                  }
                  Update: {
                    "advance_days"?: number,"circle_id"?: string,"created_at"?: string,"done_at"?: string | null,"done_by"?: string | null,"done_via"?: string | null,"due_at"?: string,"event_at"?: string,"followup_sent_at"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["occurrence_kind"],"local_date"?: string,"not_done_reason"?: string | null,"notified_at"?: string | null,"reminder_id"?: string,"snoozed_until"?: string | null,"status"?: Database["public"]['Enums']["occurrence_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reminder_occurrences_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reminder_occurrences_done_by_fkey"
      columns: ["done_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reminder_occurrences_reminder_id_fkey"
      columns: ["reminder_id"]
isOneToOne: false
      referencedRelation: "reminders"
      referencedColumns: ["id"]
    }
                  ]
                },"reminders": {
                  Row: {
                    "active": boolean,"advance_days": (number)[],"circle_id": string,"created_at": string,"created_by": string | null,"id": string,"importance": Database["public"]['Enums']["importance"],"kind": Database["public"]['Enums']["reminder_kind"],"med_instructions_enc": string | null,"med_name_enc": string | null,"rule": NonNullable<Json>,"source": string,"title": string,"updated_at": string,"visible_to_cared": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"advance_days"?: (number)[],"circle_id": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"importance"?: Database["public"]['Enums']["importance"],"kind": Database["public"]['Enums']["reminder_kind"],"med_instructions_enc"?: string | null,"med_name_enc"?: string | null,"rule": NonNullable<Json>,"source"?: string,"title": string,"updated_at"?: string,"visible_to_cared"?: boolean
                  }
                  Update: {
                    "active"?: boolean,"advance_days"?: (number)[],"circle_id"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"importance"?: Database["public"]['Enums']["importance"],"kind"?: Database["public"]['Enums']["reminder_kind"],"med_instructions_enc"?: string | null,"med_name_enc"?: string | null,"rule"?: NonNullable<Json>,"source"?: string,"title"?: string,"updated_at"?: string,"visible_to_cared"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "reminders_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reminders_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"resources": {
                  Row: {
                    "active": boolean,"created_at": string,"description": string,"id": string,"name": string,"phone": string | null,"region": string,"source_url": string,"updated_at": string,"url": string | null,"verified_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"description": string,"id"?: string,"name": string,"phone"?: string | null,"region"?: string,"source_url": string,"updated_at"?: string,"url"?: string | null,"verified_at"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"description"?: string,"id"?: string,"name"?: string,"phone"?: string | null,"region"?: string,"source_url"?: string,"updated_at"?: string,"url"?: string | null,"verified_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"selfcare_checkins": {
                  Row: {
                    "checkin_date": string,"created_at": string,"id": string,"score": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checkin_date": string,"created_at"?: string,"id"?: string,"score": number,"user_id": string
                  }
                  Update: {
                    "checkin_date"?: string,"created_at"?: string,"id"?: string,"score"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "selfcare_checkins_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"survey_responses": {
                  Row: {
                    "answers": NonNullable<Json>,"created_at": string,"dismissed": boolean,"id": string,"survey_key": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"created_at"?: string,"dismissed"?: boolean,"id"?: string,"survey_key": string,"user_id": string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"created_at"?: string,"dismissed"?: boolean,"id"?: string,"survey_key"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "survey_responses_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "circle_id": string,"claimed_by": string | null,"created_at": string,"created_by": string | null,"done_at": string | null,"done_by": string | null,"id": string,"scheduled_for": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"claimed_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"done_at"?: string | null,"done_by"?: string | null,"id"?: string,"scheduled_for"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "circle_id"?: string,"claimed_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"done_at"?: string | null,"done_by"?: string | null,"id"?: string,"scheduled_for"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_claimed_by_fkey"
      columns: ["claimed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_done_by_fkey"
      columns: ["done_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tips": {
                  Row: {
                    "active": boolean,"activity_title": string | null,"care_types": (Database["public"]['Enums']["care_type"])[],"created_at": string,"id": string,"kind": string,"text": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"activity_title"?: string | null,"care_types"?: (Database["public"]['Enums']["care_type"])[],"created_at"?: string,"id"?: string,"kind": string,"text": string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"activity_title"?: string | null,"care_types"?: (Database["public"]['Enums']["care_type"])[],"created_at"?: string,"id"?: string,"kind"?: string,"text"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invitation":
{ Args: { "p_display_name": string,"p_token_hash": string }; Returns: string
                           },
"acquire_job_lease":
{ Args: { "p_name": string,"p_seconds": number }; Returns: boolean
                           },
"admin_db_size_bytes":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"claim_task":
{ Args: { "p_task": string }; Returns: undefined
                           },
"cleanup_rate_limits":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"close_circle":
{ Args: { "p_circle": string,"p_reason": string }; Returns: undefined
                           },
"create_circle":
{ Args: { "p_care_type": Database["public"]['Enums']["care_type"],"p_cared_name": string,"p_display_name": string,"p_relation": string }; Returns: string
                           },
"is_admin_with_mfa":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"mark_occurrence":
{ Args: { "p_idempotency_key": string,"p_occurrence": string,"p_reason"?: string,"p_snooze_minutes"?: number,"p_status": Database["public"]['Enums']["occurrence_status"],"p_via"?: string }; Returns: {
              "advance_days": number,
"circle_id": string,
"created_at": string,
"done_at": string | null,
"done_by": string | null,
"done_via": string | null,
"due_at": string,
"event_at": string,
"followup_sent_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["occurrence_kind"],
"local_date": string,
"not_done_reason": string | null,
"notified_at": string | null,
"reminder_id": string,
"snoozed_until": string | null,
"status": Database["public"]['Enums']["occurrence_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "reminder_occurrences"
        isOneToOne: true
        isSetofReturn: false
      } },
"purge_user":
{ Args: { "p_uid": string }; Returns: undefined
                           },
"rate_limit_hit":
{ Args: { "p_key": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"release_job_lease":
{ Args: { "p_name": string }; Returns: undefined
                           },
"set_member_notify_kinds":
{ Args: { "p_circle": string,"p_kinds": (string)[],"p_user": string }; Returns: undefined
                           }
          }
          Enums: {
            "care_type": "adulto_mayor"|"demencias"|"dialisis"|"discapacidad_fisica"|"discapacidad_intelectual"|"cronica_general"|"recuperacion_cirugia"|"ninez_necesidades_especiales"|"desde_cero","consent_layer": "terms"|"sensitive"|"research","importance": "important"|"normal"|"whenever","member_role": "caregiver"|"family"|"cared"|"professional","occurrence_kind": "main"|"advance","occurrence_status": "pending"|"done"|"not_done"|"snoozed"|"skipped","reminder_kind": "medication"|"food"|"activity"|"appointment"|"errand"|"important_date"|"custom"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "care_type": ["adulto_mayor", "demencias", "dialisis", "discapacidad_fisica", "discapacidad_intelectual", "cronica_general", "recuperacion_cirugia", "ninez_necesidades_especiales", "desde_cero"],"consent_layer": ["terms", "sensitive", "research"],"importance": ["important", "normal", "whenever"],"member_role": ["caregiver", "family", "cared", "professional"],"occurrence_kind": ["main", "advance"],"occurrence_status": ["pending", "done", "not_done", "snoozed", "skipped"],"reminder_kind": ["medication", "food", "activity", "appointment", "errand", "important_date", "custom"]
          }
        }
} as const
