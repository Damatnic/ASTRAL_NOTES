import re

def fix_personalities():
    with open('client/src/services/aiWritingCompanion.ts', 'r') as f:
        content = f.read()
    
    # Fix personality initialization
    old_personalities = r'''this\.personalities = \[
      \{
        id: 'mentor',
        name: 'Wise Mentor',
        description: 'Supportive and guiding',
        traits: \['supportive', 'motivating', 'patient'\],
        greetingStyle: 'warm',
        feedbackStyle: 'constructive',
        isActive: true
      \},
      \{
        id: 'critic',
        name: 'Analytical Critic',
        description: 'Detail-oriented and precise',
        traits: \['analytical', 'precise', 'thorough'\],
        greetingStyle: 'professional',
        feedbackStyle: 'detailed',
        isActive: false
      \},
      \{
        id: 'cheerleader','''
    
    new_personalities = '''this.personalities = [
      {
        id: 'mentor',
        name: 'Wise Mentor',
        description: 'Supportive and guiding',
        role: 'mentor',
        traits: {
          encouraging: 80,
          critical: 20,
          creative: 60,
          analytical: 70
        },
        greetingStyle: 'warm',
        feedbackStyle: 'constructive',
        isActive: true
      },
      {
        id: 'critic',
        name: 'Analytical Critic',
        description: 'Detail-oriented and precise',
        role: 'critic',
        traits: {
          encouraging: 30,
          critical: 90,
          creative: 40,
          analytical: 95
        },
        greetingStyle: 'professional',
        feedbackStyle: 'detailed',
        isActive: false
      },
      {
        id: 'cheerleader',
        name: 'Enthusiastic Cheerleader',
        description: 'Energetic and supportive',
        role: 'cheerleader',
        traits: {
          encouraging: 95,
          critical: 10,
          creative: 75,
          analytical: 30
        },
        greetingStyle: 'artistic',
        feedbackStyle: 'encouraging',
        isActive: false
      },
      {
        id: 'collaborator',
        name: 'Creative Collaborator',
        description: 'Collaborative and creative',
        role: 'collaborator',
        traits: {
          encouraging: 70,
          critical: 40,
          creative: 90,
          analytical: 60
        },
        greetingStyle: 'curious',
        feedbackStyle: 'collaborative',
        isActive: false
      },
      {
        id: 'editor',
        name: 'Professional Editor',
        description: 'Focused on quality and precision',
        role: 'editor',
        traits: {
          encouraging: 50,
          critical: 80,
          creative: 30,
          analytical: 85
        },
        greetingStyle: 'direct',
        feedbackStyle: 'editorial',
        isActive: false
      }'''
    
    # Find and replace the personalities initialization
    pattern = r'this\.personalities = \[.*?\];'
    
    # Find the start of personalities array
    start_pos = content.find('this.personalities = [')
    if start_pos != -1:
        # Find the end of the array (matching closing bracket)
        bracket_count = 0
        pos = start_pos + len('this.personalities = [')
        while pos < len(content):
            if content[pos] == '[':
                bracket_count += 1
            elif content[pos] == ']':
                if bracket_count == 0:
                    break
                bracket_count -= 1
            pos += 1
        
        if pos < len(content):
            # Replace the personalities initialization
            before = content[:start_pos]
            after = content[pos + 1:]
            content = before + new_personalities + '\n    ];' + after
    
    with open('client/src/services/aiWritingCompanion.ts', 'w') as f:
        f.write(content)
    
    print("Fixed personality initialization")

if __name__ == "__main__":
    fix_personalities()
