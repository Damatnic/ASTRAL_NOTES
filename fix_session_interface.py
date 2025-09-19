import re

def fix_session_interface():
    with open('client/src/services/aiWritingCompanion.ts', 'r') as f:
        content = f.read()
    
    # Fix WritingSession interface to include missing properties
    old_interface = r'''export interface WritingSession \{
  id: string;
  title: string;
  contentId\?: string;
  mood\?: string;
  startTime: number;
  endTime\?: number;
  content: string;
  wordCount: number;
  timeSpent: number;
  productivity: number;
  suggestions: AISuggestion\[\];
  feedback: AIFeedback\[\];
  aiInteractions: number;
  isActive: boolean;
\}'''
    
    new_interface = '''export interface WritingSession {
  id: string;
  title: string;
  contentId?: string;
  mood?: string;
  startTime: number;
  endTime?: number;
  content: string;
  wordCount: number;
  totalWords: number;
  wordsAdded: number;
  timeSpent: number;
  productivity: number;
  suggestions: AISuggestion[];
  feedback: AIFeedback[];
  aiInteractions: number;
  isActive: boolean;
}'''
    
    content = re.sub(old_interface, new_interface, content)
    
    # Fix startWritingSession to initialize the missing properties
    old_session_creation = r'''const session: WritingSession = \{
      id: `session_\$\{Date\.now\(\)\}_\$\{Math\.random\(\)\.toString\(36\)\.substring\(2, 9\)\}`,
      title,
      contentId,
      mood: this\.validateMood\(mood\) \|\| 'neutral',
      startTime: Date\.now\(\),
      content: '',
      wordCount: 0,
      timeSpent: 0,
      productivity: 0,'''
    
    new_session_creation = '''const session: WritingSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title,
      contentId,
      mood: this.validateMood(mood) || 'neutral',
      startTime: Date.now(),
      content: '',
      wordCount: 0,
      totalWords: 0,
      wordsAdded: 0,
      timeSpent: 0,
      productivity: 0,'''
    
    content = re.sub(old_session_creation, new_session_creation, content)
    
    # Add getCurrentSession method if it doesn't exist
    if 'getCurrentSession()' not in content:
        # Find a good place to add it (after startWritingSession)
        insert_point = content.find('this.saveToLocalStorage();') + len('this.saveToLocalStorage();')
        if insert_point > len('this.saveToLocalStorage();') - 1:
            # Find the end of startWritingSession method
            start_pos = content.find('async startWritingSession(')
            if start_pos != -1:
                brace_count = 0
                pos = start_pos
                while pos < len(content):
                    if content[pos] == '{':
                        brace_count += 1
                    elif content[pos] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            break
                    pos += 1
                
                if pos < len(content):
                    # Insert getCurrentSession method after startWritingSession
                    before = content[:pos + 1]
                    after = content[pos + 1:]
                    
                    new_method = '''

  getCurrentSession(): WritingSession | null {
    return this.currentSession;
  }'''
                    
                    content = before + new_method + after
    
    with open('client/src/services/aiWritingCompanion.ts', 'w') as f:
        f.write(content)
    
    print("Fixed session interface and methods")

if __name__ == "__main__":
    fix_session_interface()
