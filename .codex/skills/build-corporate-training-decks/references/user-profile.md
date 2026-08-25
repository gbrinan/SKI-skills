# User Profile for Corporate Training Decks

Fill only the fields you want reused across training-deck tasks. Leave unknown or project-specific fields blank.

The current user request and current client requirements always override this profile.

Do not store passwords, access tokens, government identifiers, private contact details, customer-confidential information, or secrets here. For contact fields, use only information intended to appear publicly in training materials.

## Profile

```yaml
identity:
  display_name: ""
  professional_title: ""
  organization: ""
  public_bio: ""
  public_contact: ""
  public_website: ""

expertise:
  primary_topics: []
  industries: []
  public_credentials: []
  public_career_highlights: []
  approved_client_examples: []

teaching_defaults:
  language: "ko"
  tone: "practical, calm, and direct"
  preferred_audience: ""
  assumed_prior_knowledge: ""
  default_duration_minutes: ""
  default_hands_on_ratio: ""
  facilitation_style: ""
  learner_address: ""

content_preferences:
  preferred_examples: []
  terms_to_define: []
  preferred_phrases: []
  phrases_to_avoid: []
  required_disclaimers: []
  accessibility_preferences: []

deck_preferences:
  include_instructor_slide: "when relevant"
  include_speaker_notes: true
  preferred_output_format: ""
  preferred_template_path: ""
  public_logo_path: ""
  visual_preferences: []
```

## Field guidance

- `display_name`: Name to show on a cover or instructor slide.
- `public_bio`: Keep to one to three audience-facing sentences.
- `public_contact`: Use a business contact intended for distribution.
- `approved_client_examples`: Include only organizations or cases approved for public mention.
- `preferred_audience`: Example: `신입사원`, `팀장`, or `비개발 실무자`.
- `default_hands_on_ratio`: Example: `60%`.
- `learner_address`: Example: `여러분`, `참가자`, or `팀장님`.
- `preferred_template_path`: Use an absolute path or a project-relative path to an approved template.
- `public_logo_path`: Point only to a logo approved for use in deliverables.

## How the skill uses the profile

- Apply non-empty fields as defaults when the current request is silent.
- Use identity and career fields only when an instructor introduction is appropriate.
- Use teaching defaults to calibrate tone, examples, pacing, and activity density.
- Use content preferences to improve consistency across projects.
- Use deck preferences to choose the default format and approved template.
- Never expose internal preferences, file paths, or blank fields in the final deck.
