#!/usr/bin/env python3
"""
Fix projectService.ts to pass all tests
"""

import re

def fix_project_service():
    file_path = "/c/Users/damat/_REPOS/ASTRAL_NOTES/client/src/services/projectService.ts"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 1: Improve updateProjectSync method to properly emit events
    old_update = r'  public updateProjectSync\(id: string, data: UpdateProjectData\): Project \| null \{[^}]+\}\s*'
    new_update = '''  public updateProjectSync(id: string, data: UpdateProjectData): Project | null {
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      return null;
    }

    const updated: Project = {
      ...projects[index],
      ...data,
      updatedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
    };

    // Recalculate word count if needed
    if (data.title || data.description) {
      updated.wordCount = this.calculateProjectWordCount(id);
    }

    projects[index] = updated;
    storageService.saveProjects(projects);

    // Emit event
    this.emit('project-updated', updated);

    return updated;
  }
  '''
    
    # Fix 2: Fix createStory to properly save changes
    old_create_story = r'  public async createStory\(data: \{ title: string; description\?: string; projectId: string \}\): Promise<any> \{[^}]+?\n  \}'
    new_create_story = '''  public async createStory(data: { title: string; description?: string; projectId: string }): Promise<any> {
    const now = new Date().toISOString();
    const story = {
      id: this.generateId(),
      title: data.title,
      description: data.description || '',
      projectId: data.projectId,
      content: '',
      wordCount: 0,
      type: 'story',
      createdAt: now,
      updatedAt: now,
      isArchived: false,
      order: 0
    };

    // Store story in project and save to storage
    const projects = this.getAllProjects();
    const projectIndex = projects.findIndex(p => p.id === data.projectId);
    if (projectIndex !== -1) {
      projects[projectIndex].stories = projects[projectIndex].stories || [];
      projects[projectIndex].stories.push(story);
      projects[projectIndex].updatedAt = now;
      storageService.saveProjects(projects);
    }

    return story;
  }'''
    
    # Fix 3: Fix updateStory to properly save changes
    old_update_story = r'  public async updateStory\(storyId: string, updates: any\): Promise<any> \{[^}]+?\n  \}'
    new_update_story = '''  public async updateStory(storyId: string, updates: any): Promise<any> {
    const projects = this.getAllProjects();
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      if (project.stories) {
        const storyIndex = project.stories.findIndex(s => s.id === storyId);
        if (storyIndex !== -1) {
          const updatedStory = {
            ...project.stories[storyIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          projects[i].stories[storyIndex] = updatedStory;
          projects[i].updatedAt = new Date().toISOString();
          storageService.saveProjects(projects);
          return updatedStory;
        }
      }
    }
    return null;
  }'''
    
    # Fix 4: Fix createCharacter to properly save changes
    old_create_character = r'  public async createCharacter\(data: \{ name: string; description\?: string; projectId: string \}\): Promise<any> \{[^}]+?\n  \}'
    new_create_character = '''  public async createCharacter(data: { name: string; description?: string; projectId: string }): Promise<any> {
    const now = new Date().toISOString();
    const character = {
      id: this.generateId(),
      name: data.name,
      description: data.description || '',
      projectId: data.projectId,
      role: 'supporting',
      age: undefined,
      appearance: '',
      personality: '',
      backstory: '',
      goals: '',
      createdAt: now,
      updatedAt: now
    };

    // Store character in project and save to storage
    const projects = this.getAllProjects();
    const projectIndex = projects.findIndex(p => p.id === data.projectId);
    if (projectIndex !== -1) {
      projects[projectIndex].characters = projects[projectIndex].characters || [];
      projects[projectIndex].characters.push(character);
      projects[projectIndex].updatedAt = now;
      storageService.saveProjects(projects);
    }

    return character;
  }'''
    
    # Fix 5: Fix updateCharacter to properly save changes
    old_update_character = r'  public async updateCharacter\(characterId: string, updates: any\): Promise<any> \{[^}]+?\n  \}'
    new_update_character = '''  public async updateCharacter(characterId: string, updates: any): Promise<any> {
    const projects = this.getAllProjects();
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      if (project.characters) {
        const characterIndex = project.characters.findIndex(c => c.id === characterId);
        if (characterIndex !== -1) {
          const updatedCharacter = {
            ...project.characters[characterIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          projects[i].characters[characterIndex] = updatedCharacter;
          projects[i].updatedAt = new Date().toISOString();
          storageService.saveProjects(projects);
          return updatedCharacter;
        }
      }
    }
    return null;
  }'''
    
    # Fix 6: Fix deleteCharacter to properly save changes
    old_delete_character = r'  public async deleteCharacter\(characterId: string\): Promise<boolean> \{[^}]+?\n  \}'
    new_delete_character = '''  public async deleteCharacter(characterId: string): Promise<boolean> {
    const projects = this.getAllProjects();
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      if (project.characters) {
        const characterIndex = project.characters.findIndex(c => c.id === characterId);
        if (characterIndex !== -1) {
          projects[i].characters.splice(characterIndex, 1);
          projects[i].updatedAt = new Date().toISOString();
          storageService.saveProjects(projects);
          return true;
        }
      }
    }
    return false;
  }'''

    # Apply fixes
    content = re.sub(old_create_story, new_create_story, content, flags=re.DOTALL)
    content = re.sub(old_update_story, new_update_story, content, flags=re.DOTALL)
    content = re.sub(old_create_character, new_create_character, content, flags=re.DOTALL)
    content = re.sub(old_update_character, new_update_character, content, flags=re.DOTALL)
    content = re.sub(old_delete_character, new_delete_character, content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed projectService.ts with better data persistence")

if __name__ == "__main__":
    fix_project_service()