import re

def fix_personality_complete():
    with open('client/src/services/aiWritingCompanion.ts', 'r') as f:
        content = f.read()
    
    # Update AIPersonality interface to include missing properties
    old_interface = r'''export interface AIPersonality \{
  id: string;
  name: string;
  description: string;
  role: string;
  traits: \{
    encouraging: number;
    critical: number;
    creative: number;
    analytical: number;
  \};
  greetingStyle: string;
  feedbackStyle: string;
  isActive: boolean;
\}'''
    
    new_interface = '''export interface AIPersonality {
  id: string;
  name: string;
  description: string;
  role: string;
  traits: {
    encouraging: number;
    critical: number;
    creative: number;
    analytical: number;
  };
  specialties: string[];
  communicationStyle: string;
  greetingStyle: string;
  feedbackStyle: string;
  isActive: boolean;
}'''
    
    content = re.sub(old_interface, new_interface, content)
    
    # Update personality initialization to include missing properties
    personalities = [
        {
            'id': 'mentor', 'role': 'mentor', 'name': 'Wise Mentor',
            'traits': {'encouraging': 80, 'critical': 20, 'creative': 60, 'analytical': 70},
            'specialties': ['guidance', 'motivation', 'story_structure'],
            'communicationStyle': 'supportive'
        },
        {
            'id': 'critic', 'role': 'critic', 'name': 'Analytical Critic',
            'traits': {'encouraging': 30, 'critical': 90, 'creative': 40, 'analytical': 95},
            'specialties': ['grammar', 'style_analysis', 'plot_holes'],
            'communicationStyle': 'formal'
        },
        {
            'id': 'cheerleader', 'role': 'cheerleader', 'name': 'Enthusiastic Cheerleader',
            'traits': {'encouraging': 95, 'critical': 10, 'creative': 75, 'analytical': 30},
            'specialties': ['motivation', 'confidence_building', 'encouragement'],
            'communicationStyle': 'playful'
        },
        {
            'id': 'collaborator', 'role': 'collaborator', 'name': 'Creative Collaborator',
            'traits': {'encouraging': 70, 'critical': 40, 'creative': 90, 'analytical': 60},
            'specialties': ['brainstorming', 'idea_generation', 'creative_prompts'],
            'communicationStyle': 'casual'
        },
        {
            'id': 'editor', 'role': 'editor', 'name': 'Professional Editor',
            'traits': {'encouraging': 50, 'critical': 80, 'creative': 30, 'analytical': 85},
            'specialties': ['editing', 'proofreading', 'structure'],
            'communicationStyle': 'direct'
        }
    ]
    
    # Find the personalities initialization and replace it
    start_marker = 'this.personalities = ['
    end_marker = '];'
    
    start_pos = content.find(start_marker)
    if start_pos != -1:
        # Find the matching closing bracket
        bracket_count = 0
        pos = start_pos + len(start_marker)
        while pos < len(content):
            if content[pos] == '[':
                bracket_count += 1
            elif content[pos] == ']':
                if bracket_count == 0:
                    break
                bracket_count -= 1
            pos += 1
        
        # Add 1 to include the closing bracket, then skip the semicolon
        end_pos = pos + 2  # '];'
        
        if end_pos <= len(content):
            # Build the new personalities array
            new_init = 'this.personalities = [\n'
            for p in personalities:
                new_init += f'''      {{
        id: '{p["id"]}',
        name: '{p["name"]}',
        description: '{p["name"].split()[1]} personality',
        role: '{p["role"]}',
        traits: {{
          encouraging: {p["traits"]["encouraging"]},
          critical: {p["traits"]["critical"]},
          creative: {p["traits"]["creative"]},
          analytical: {p["traits"]["analytical"]}
        }},
        specialties: {str(p["specialties"]).replace("'", '"')},
        communicationStyle: '{p["communicationStyle"]}',
        greetingStyle: '{p["communicationStyle"]}',
        feedbackStyle: 'constructive',
        isActive: {'true' if p["id"] == 'mentor' else 'false'}
      }},\n'''
            
            new_init = new_init.rstrip(',\n') + '\n    ];'
            
            # Replace the old initialization
            before = content[:start_pos]
            after = content[end_pos:]
            content = before + new_init + after
    
    with open('client/src/services/aiWritingCompanion.ts', 'w') as f:
        f.write(content)
    
    print("Fixed complete personality interface and initialization")

if __name__ == "__main__":
    fix_personality_complete()
