import re

def fix_project_service():
    with open('client/src/services/projectService.ts', 'r') as f:
        content = f.read()
    
    # Fix createStory method
    old_create_story = r'(\s+)// Store story in project\n(\s+)const project = this\.getProjectById\(data\.projectId\);\n(\s+)if \(project\) \{\n(\s+)project\.stories = project\.stories \|\| \[\];\n(\s+)project\.stories\.push\(story\);\n(\s+)this\.updateProjectSync\(data\.projectId, \{ updatedAt: now \}\);\n(\s+)\}'
    new_create_story = r'\1// Store story in project and save to storage\n\1const projects = this.getAllProjects();\n\1const projectIndex = projects.findIndex(p => p.id === data.projectId);\n\1if (projectIndex !== -1) {\n\1  projects[projectIndex].stories = projects[projectIndex].stories || [];\n\1  projects[projectIndex].stories.push(story);\n\1  projects[projectIndex].updatedAt = now;\n\1  storageService.saveProjects(projects);\n\1}'
    
    content = re.sub(old_create_story, new_create_story, content)
    
    # Fix updateStory method
    old_update_story = r'(\s+)const projects = this\.getAllProjects\(\);\n(\s+)for \(const project of projects\) \{\n(\s+)if \(project\.stories\) \{\n(\s+)const storyIndex = project\.stories\.findIndex\(s => s\.id === storyId\);\n(\s+)if \(storyIndex !== -1\) \{\n(\s+)const updatedStory = \{\n(\s+)\.\.\.project\.stories\[storyIndex\],\n(\s+)\.\.\.updates,\n(\s+)updatedAt: new Date\(\)\.toISOString\(\)\n(\s+)\};\n(\s+)project\.stories\[storyIndex\] = updatedStory;\n(\s+)this\.updateProjectSync\(project\.id, \{ updatedAt: new Date\(\)\.toISOString\(\) \}\);\n(\s+)return updatedStory;\n(\s+)\}\n(\s+)\}\n(\s+)\}'
    new_update_story = r'\1const projects = this.getAllProjects();\n\1for (let i = 0; i < projects.length; i++) {\n\1  const project = projects[i];\n\1  if (project.stories) {\n\1    const storyIndex = project.stories.findIndex(s => s.id === storyId);\n\1    if (storyIndex !== -1) {\n\1      const updatedStory = {\n\1        ...project.stories[storyIndex],\n\1        ...updates,\n\1        updatedAt: new Date().toISOString()\n\1      };\n\1      projects[i].stories[storyIndex] = updatedStory;\n\1      projects[i].updatedAt = new Date().toISOString();\n\1      storageService.saveProjects(projects);\n\1      return updatedStory;\n\1    }\n\1  }\n\1}'
    
    content = re.sub(old_update_story, new_update_story, content, flags=re.DOTALL)
    
    # Fix createCharacter method
    old_create_character = r'(\s+)// Store character in project\n(\s+)const project = this\.getProjectById\(data\.projectId\);\n(\s+)if \(project\) \{\n(\s+)project\.characters = project\.characters \|\| \[\];\n(\s+)project\.characters\.push\(character\);\n(\s+)this\.updateProjectSync\(data\.projectId, \{ updatedAt: now \}\);\n(\s+)\}'
    new_create_character = r'\1// Store character in project and save to storage\n\1const projects = this.getAllProjects();\n\1const projectIndex = projects.findIndex(p => p.id === data.projectId);\n\1if (projectIndex !== -1) {\n\1  projects[projectIndex].characters = projects[projectIndex].characters || [];\n\1  projects[projectIndex].characters.push(character);\n\1  projects[projectIndex].updatedAt = now;\n\1  storageService.saveProjects(projects);\n\1}'
    
    content = re.sub(old_create_character, new_create_character, content)
    
    # Fix updateCharacter method
    old_update_character = r'(\s+)const projects = this\.getAllProjects\(\);\n(\s+)for \(const project of projects\) \{\n(\s+)if \(project\.characters\) \{\n(\s+)const characterIndex = project\.characters\.findIndex\(c => c\.id === characterId\);\n(\s+)if \(characterIndex !== -1\) \{\n(\s+)const updatedCharacter = \{\n(\s+)\.\.\.project\.characters\[characterIndex\],\n(\s+)\.\.\.updates,\n(\s+)updatedAt: new Date\(\)\.toISOString\(\)\n(\s+)\};\n(\s+)project\.characters\[characterIndex\] = updatedCharacter;\n(\s+)this\.updateProjectSync\(project\.id, \{ updatedAt: new Date\(\)\.toISOString\(\) \}\);\n(\s+)return updatedCharacter;\n(\s+)\}\n(\s+)\}\n(\s+)\}'
    new_update_character = r'\1const projects = this.getAllProjects();\n\1for (let i = 0; i < projects.length; i++) {\n\1  const project = projects[i];\n\1  if (project.characters) {\n\1    const characterIndex = project.characters.findIndex(c => c.id === characterId);\n\1    if (characterIndex !== -1) {\n\1      const updatedCharacter = {\n\1        ...project.characters[characterIndex],\n\1        ...updates,\n\1        updatedAt: new Date().toISOString()\n\1      };\n\1      projects[i].characters[characterIndex] = updatedCharacter;\n\1      projects[i].updatedAt = new Date().toISOString();\n\1      storageService.saveProjects(projects);\n\1      return updatedCharacter;\n\1    }\n\1  }\n\1}'
    
    content = re.sub(old_update_character, new_update_character, content, flags=re.DOTALL)
    
    # Also fix deleteStory and deleteCharacter to save properly
    old_delete_story = r'(\s+)const projects = this\.getAllProjects\(\);\n(\s+)for \(const project of projects\) \{\n(\s+)if \(project\.stories\) \{\n(\s+)const storyIndex = project\.stories\.findIndex\(s => s\.id === storyId\);\n(\s+)if \(storyIndex !== -1\) \{\n(\s+)project\.stories\.splice\(storyIndex, 1\);\n(\s+)this\.updateProjectSync\(project\.id, \{ updatedAt: new Date\(\)\.toISOString\(\) \}\);\n(\s+)return true;\n(\s+)\}\n(\s+)\}\n(\s+)\}'
    new_delete_story = r'\1const projects = this.getAllProjects();\n\1for (let i = 0; i < projects.length; i++) {\n\1  const project = projects[i];\n\1  if (project.stories) {\n\1    const storyIndex = project.stories.findIndex(s => s.id === storyId);\n\1    if (storyIndex !== -1) {\n\1      projects[i].stories.splice(storyIndex, 1);\n\1      projects[i].updatedAt = new Date().toISOString();\n\1      storageService.saveProjects(projects);\n\1      return true;\n\1    }\n\1  }\n\1}'
    
    content = re.sub(old_delete_story, new_delete_story, content, flags=re.DOTALL)
    
    old_delete_character = r'(\s+)const projects = this\.getAllProjects\(\);\n(\s+)for \(const project of projects\) \{\n(\s+)if \(project\.characters\) \{\n(\s+)const characterIndex = project\.characters\.findIndex\(c => c\.id === characterId\);\n(\s+)if \(characterIndex !== -1\) \{\n(\s+)project\.characters\.splice\(characterIndex, 1\);\n(\s+)this\.updateProjectSync\(project\.id, \{ updatedAt: new Date\(\)\.toISOString\(\) \}\);\n(\s+)return true;\n(\s+)\}\n(\s+)\}\n(\s+)\}'
    new_delete_character = r'\1const projects = this.getAllProjects();\n\1for (let i = 0; i < projects.length; i++) {\n\1  const project = projects[i];\n\1  if (project.characters) {\n\1    const characterIndex = project.characters.findIndex(c => c.id === characterId);\n\1    if (characterIndex !== -1) {\n\1      projects[i].characters.splice(characterIndex, 1);\n\1      projects[i].updatedAt = new Date().toISOString();\n\1      storageService.saveProjects(projects);\n\1      return true;\n\1    }\n\1  }\n\1}'
    
    content = re.sub(old_delete_character, new_delete_character, content, flags=re.DOTALL)
    
    with open('client/src/services/projectService.ts', 'w') as f:
        f.write(content)
    
    print("Fixed projectService methods with proper storage updates")

if __name__ == "__main__":
    fix_project_service()
