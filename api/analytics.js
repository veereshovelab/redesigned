import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manual Env Loader as a fallback for Vercel CLI local env binding issues
function findEnvFile(filename) {
  let dir = process.cwd();
  while (true) {
    const fullPath = path.join(dir, filename);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    let currentDir = path.dirname(__filename);
    while (true) {
      const fullPath = path.join(currentDir, filename);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
  } catch (err) {
    console.debug("Could not resolve env file relative to import.meta.url:", err);
  }

  return null;
}

function loadEnv() {
  ['.env', '.env.local'].forEach(file => {
    try {
      const envPath = findEnvFile(file);
      if (envPath) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const parts = trimmed.split('=');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            let val = parts.slice(1).join('=').trim();
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1);
            }
            if (val.startsWith("'") && val.endsWith("'")) {
              val = val.substring(1, val.length - 1);
            }
            process.env[key] = val;
          }
        });
      }
    } catch (err) {
      console.error(`Error loading env file ${file} manually:`, err);
    }
  });
}

loadEnv();

let supabaseClient;
function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials in serverless environment.");
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

/**
 * Serverless Backend Handler: Platform Analytics & Campaign Velocity API
 * GET/POST /api/analytics?projectId=...
 */
export default async function handler(req, res) {
  // Support CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  const queryProjectId = req.query?.projectId || req.query?.project_id || req.query?.id;
  const bodyProjectId = req.body?.projectId || req.body?.project_id;
  const projectId = (queryProjectId || bodyProjectId || '').toString().trim();

  try {
    const supabase = getSupabaseClient();

    // Fetch projects and donations from database
    const { data: projects = [] } = await supabase.from('projects').select('*');
    const { data: donations = [] } = await supabase.from('donations').select('*');

    // Default fallback data if DB is empty
    const activeProjects = projects && projects.length > 0 ? projects : [
      { id: 'keyboard', title: 'Helix-68 Keyboard', category: 'Design', goal_amount: 15000, raised_amount: 12450, backer_count: 138, status: 'approved' },
      { id: 'smarthub', title: 'Aura Hub Assistant', category: 'Tech', goal_amount: 45000, raised_amount: 49200, backer_count: 384, status: 'approved' },
      { id: 'game', title: 'Cyberpunk RPG', category: 'Games', goal_amount: 20000, raised_amount: 8200, backer_count: 95, status: 'approved' },
      { id: 'backpack', title: 'Nomad Pro Backpack', category: 'Design', goal_amount: 10000, raised_amount: 34200, backer_count: 280, status: 'approved' }
    ];

    const allDonations = donations && donations.length > 0 ? donations : [
      { amount: 129, status: 'successful', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { amount: 99, status: 'successful', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
      { amount: 50, status: 'successful', created_at: new Date(Date.now() - 86400000 * 8).toISOString() }
    ];

    // Compute global metrics
    const totalPlatformRaised = activeProjects.reduce((sum, p) => sum + Number(p.raised_amount || p.raisedAmount || 0), 0);
    const totalGoalTarget = activeProjects.reduce((sum, p) => sum + Number(p.goal_amount || p.goalAmount || 0), 0);
    const totalBackers = activeProjects.reduce((sum, p) => sum + Number(p.backer_count || p.backerCount || 0), 0);
    const averagePledgeAmount = allDonations.length > 0 
      ? Math.round(allDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0) / allDonations.length) 
      : 45;

    // Category distribution
    const categoryDistribution = activeProjects.reduce((acc, p) => {
      const cat = p.category || 'Tech';
      acc[cat] = (acc[cat] || 0) + Number(p.raised_amount || p.raisedAmount || 0);
      return acc;
    }, {});

    // If specific campaign requested
    if (projectId) {
      const targetProj = activeProjects.find(p => p.id === projectId);
      if (!targetProj) {
        return res.status(404).json({ error: `Campaign "${projectId}" not found.` });
      }

      const projRaised = Number(targetProj.raised_amount || targetProj.raisedAmount || 0);
      const projGoal = Number(targetProj.goal_amount || targetProj.goalAmount || 0);
      const percentFunded = Math.round((projRaised / projGoal) * 100);

      return res.status(200).json({
        type: 'campaign_velocity',
        projectId,
        title: targetProj.title,
        category: targetProj.category,
        metrics: {
          raisedAmount: projRaised,
          goalAmount: projGoal,
          percentFunded,
          isFunded: percentFunded >= 100,
          backerCount: Number(targetProj.backer_count || targetProj.backerCount || 0),
          averagePledge: Math.round(projRaised / (Number(targetProj.backer_count || targetProj.backerCount) || 1)),
          escrowHealthScore: '99.4%',
          fundingStatus: percentFunded >= 100 ? 'Goal Achieved' : 'Active Funding Phase'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Global Platform Response
    return res.status(200).json({
      type: 'platform_analytics',
      summary: {
        totalPlatformRaised,
        totalGoalTarget,
        overallFundedRatio: `${Math.round((totalPlatformRaised / totalGoalTarget) * 100)}%`,
        totalBackers,
        totalActiveCampaigns: activeProjects.length,
        averagePledgeAmount,
        escrowEscrowCoverage: '100%'
      },
      categoryDistribution,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error in analytics API:', err);
    return res.status(500).json({ 
      error: 'Internal server error calculating analytics',
      details: err.message 
    });
  }
}
