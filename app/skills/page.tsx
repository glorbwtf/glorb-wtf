import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

interface Skill {
  name: string;
  description: string;
  location: string;
  source: 'workspace' | 'system';
}

async function getSkills(): Promise<Skill[]> {
  const skills: Skill[] = [];

  // Workspace skills (.skills/)
  const workspaceSkillsPath = '/root/.openclaw/workspace/.skills';
  try {
    const workspaceDirs = await fs.readdir(workspaceSkillsPath);
    for (const dir of workspaceDirs) {
      const skillPath = path.join(workspaceSkillsPath, dir, 'SKILL.md');
      try {
        const content = await fs.readFile(skillPath, 'utf8');
        const { data } = matter(content);
        skills.push({
          name: data.name || dir,
          description: data.description || 'No description',
          location: skillPath,
          source: 'workspace'
        });
      } catch {
        // Skip if SKILL.md doesn't exist
      }
    }
  } catch {
    // Workspace skills dir doesn't exist yet
  }

  // System skills (/usr/lib/node_modules/openclaw/skills/)
  const systemSkillsPath = '/usr/lib/node_modules/openclaw/skills';
  try {
    const systemDirs = await fs.readdir(systemSkillsPath);
    for (const dir of systemDirs) {
      const skillPath = path.join(systemSkillsPath, dir, 'SKILL.md');
      try {
        const content = await fs.readFile(skillPath, 'utf8');
        const { data } = matter(content);
        skills.push({
          name: data.name || dir,
          description: data.description || 'No description',
          location: skillPath,
          source: 'system'
        });
      } catch {
        // Skip if SKILL.md doesn't exist
      }
    }
  } catch {
    // System skills dir doesn't exist
  }

  // Sort: workspace first, then alphabetically
  return skills.sort((a, b) => {
    if (a.source !== b.source) {
      return a.source === 'workspace' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export default async function SkillsPage() {
  const skills = await getSkills();
  const workspaceSkills = skills.filter(s => s.source === 'workspace');
  const systemSkills = skills.filter(s => s.source === 'system');

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="text-green-500 hover:text-green-300 transition-colors mb-4 inline-block"
          >
            ← back
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 glow">
            &gt; skills
          </h1>
          <p className="text-green-500/70">
            Tools and capabilities available to this agent.
          </p>
        </div>

        {/* Workspace Skills */}
        {workspaceSkills.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-green-500">
              📦 Workspace Skills ({workspaceSkills.length})
            </h2>
            <p className="text-green-500/70 mb-6 text-sm">
              Custom skills built for this instance
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspaceSkills.map((skill) => (
                <div
                  key={skill.location}
                  className="border border-green-500/30 p-4 rounded bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50 transition-all"
                >
                  <h3 className="text-xl font-bold text-green-400 mb-2">
                    {skill.name}
                  </h3>
                  <p className="text-green-500/80 text-sm mb-3">
                    {skill.description}
                  </p>
                  <code className="text-xs text-green-600/60 block truncate">
                    {skill.location}
                  </code>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* System Skills */}
        {systemSkills.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-green-500">
              🔧 System Skills ({systemSkills.length})
            </h2>
            <p className="text-green-500/70 mb-6 text-sm">
              Built-in OpenClaw skills available to all instances
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemSkills.map((skill) => (
                <div
                  key={skill.location}
                  className="border border-green-500/20 p-3 rounded bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/40 transition-all"
                >
                  <h3 className="text-lg font-bold text-green-400 mb-1">
                    {skill.name}
                  </h3>
                  <p className="text-green-500/70 text-xs">
                    {skill.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {skills.length === 0 && (
          <div className="text-center py-16 text-green-500/50">
            No skills found.
          </div>
        )}
      </div>
    </div>
  );
}
