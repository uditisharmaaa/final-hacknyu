import "dotenv/config";
import express from "express";
import { handleIncomingCall, processSpeech } from "./services/twilio.js";
import { getStoredAudio, cleanupExpiredAudio } from "./services/elevenlabs.js";
import { EngagementAgent } from "./services/engagementAgent.js";
import { CampaignService } from "./services/campaignService.js";
import { CrossReferenceAgent } from "./services/crossReferenceAgent.js";

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Health check endpoint
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Engagement Agent API endpoint
app.get("/api/engagement-agent/:businessId", async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    
    if (!businessId || isNaN(businessId)) {
      return res.status(400).json({ error: "Invalid business ID" });
    }

    const agent = new EngagementAgent(businessId);
    const result = await agent.analyzeAndRecommend();
    
    res.json(result);
  } catch (error) {
    console.error("Engagement Agent API error:", error);
    res.status(500).json({ 
      error: "Failed to analyze customer engagement",
      message: error.message 
    });
  }
});

// Cross Reference Agent API endpoint - Find similar businesses
app.get("/api/cross-reference/:businessId", async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    
    if (!businessId || isNaN(businessId)) {
      return res.status(400).json({ error: "Invalid business ID" });
    }

    const agent = new CrossReferenceAgent(businessId);
    const result = await agent.findSimilarBusinesses();
    
    res.json(result);
  } catch (error) {
    console.error("Cross Reference Agent API error:", error);
    res.status(500).json({ 
      error: "Failed to find similar businesses",
      message: error.message 
    });
  }
});

// Create partnership endpoint
app.post("/api/cross-reference/:businessId/partnership", async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    const { otherBusinessId } = req.body;
    
    if (!businessId || isNaN(businessId) || !otherBusinessId) {
      return res.status(400).json({ error: "Invalid business IDs" });
    }

    const agent = new CrossReferenceAgent(businessId);
    const result = await agent.createPartnership(otherBusinessId);
    
    res.json(result);
  } catch (error) {
    console.error("Create partnership error:", error);
    res.status(500).json({ 
      error: "Failed to create partnership",
      message: error.message 
    });
  }
});

// Deactivate partnership endpoint
app.post("/api/cross-reference/:businessId/partnership/:partnershipId/deactivate", async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    const partnershipId = parseInt(req.params.partnershipId);
    
    if (!businessId || isNaN(businessId) || !partnershipId) {
      return res.status(400).json({ error: "Invalid IDs" });
    }

    const agent = new CrossReferenceAgent(businessId);
    const result = await agent.deactivatePartnership(partnershipId);
    
    res.json(result);
  } catch (error) {
    console.error("Deactivate partnership error:", error);
    res.status(500).json({ 
      error: "Failed to deactivate partnership",
      message: error.message 
    });
  }
});

// Get active partnerships endpoint
app.get("/api/cross-reference/:businessId/partnerships", async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    
    if (!businessId || isNaN(businessId)) {
      return res.status(400).json({ error: "Invalid business ID" });
    }

    const agent = new CrossReferenceAgent(businessId);
    const partnerships = await agent.getActivePartnerships();
    
    res.json({ partnerships });
  } catch (error) {
    console.error("Get partnerships error:", error);
    res.status(500).json({ 
      error: "Failed to get partnerships",
      message: error.message 
    });
  }
});

// Generate personalized message API endpoint
app.post("/api/campaigns/generate-message", async (req, res) => {
  try {
    const { businessId, campaignName, discountText, discountCode, customerId, whatsappNumber } = req.body;
    
    if (!businessId || !campaignName || !discountText || !discountCode || !customerId) {
      return res.status(400).json({ 
        error: "Missing required fields: businessId, campaignName, discountText, discountCode, customerId" 
      });
    }

    const campaignService = new CampaignService(businessId);
    
    // Get customer data
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('business_id', businessId)
      .single();
    
    if (customerError || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Generate personalized message
    const messages = await campaignService.generateCampaignMessages(
      campaignName,
      discountText,
      discountCode,
      [customer],
      whatsappNumber
    );
    
    res.json({
      success: true,
      message: messages[0] || campaignService.generateCampaignMessage(campaignName, discountText, discountCode, whatsappNumber)
    });
  } catch (error) {
    console.error("Generate message error:", error);
    res.status(500).json({ 
      error: "Failed to generate message",
      message: error.message 
    });
  }
});

// Campaign Send API endpoint
app.post("/api/campaigns/send", async (req, res) => {
  console.log("Sending campaign to customers");
  try {
    const { businessId, campaignId, campaignName, campaignType, campaignValue, discountCode, customerIds, whatsappNumber, customMessages } = req.body;
    
    // Log received data for debugging
    console.log("Received campaign send request:", {
      businessId,
      campaignId,
      customerIds,
      customerIdsType: Array.isArray(customerIds),
      customerIdsLength: customerIds?.length
    });
    
    // Validate required fields - allow campaignId to be 0, but not undefined/null
    if (businessId === undefined || businessId === null || 
        campaignId === undefined || campaignId === null || 
        !customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ 
        error: "Missing required fields: businessId, campaignId, customerIds",
        received: { businessId, campaignId, customerIds }
      });
    }
    
    // Filter out null/undefined customer IDs
    const validCustomerIds = customerIds.filter(id => id != null && id !== undefined);
    if (validCustomerIds.length === 0) {
      return res.status(400).json({ 
        error: "No valid customer IDs provided. All customer IDs are null or undefined."
      });
    }

    const campaignService = new CampaignService(businessId);
    const result = await campaignService.sendCampaign({
      campaignId,
      campaignName,
      campaignType,
      campaignValue,
      discountCode,
      customerIds: validCustomerIds, // Use filtered customer IDs
      whatsappNumber,
      customMessages // Optional: array of custom messages, one per customer
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Campaign send error:", error);
    res.status(500).json({ 
      error: "Failed to send campaign",
      message: error.message 
    });
  }
});

// Get eligible customers for a campaign
app.get("/api/campaigns/:campaignId/customers/:businessId", async (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const businessId = parseInt(req.params.businessId);
    
    if (!campaignId || !businessId || isNaN(campaignId) || isNaN(businessId)) {
      return res.status(400).json({ error: "Invalid campaign ID or business ID" });
    }

    const campaignService = new CampaignService(businessId);
    const result = await campaignService.getEligibleCustomers(campaignId);
    
    res.json(result);
  } catch (error) {
    console.error("Error getting eligible customers:", error);
    res.status(500).json({ 
      error: "Failed to get eligible customers",
      message: error.message 
    });
  }
});

app.get("/audio/:audioId", (req, res) => {
  const storedAudio = audioStore.get(req.params.audioId);
  if (!storedAudio) {
    return res.status(404).send("Audio not found");
  }

  res.setHeader("Content-Type", storedAudio.mimeType);
  res.setHeader("Cache-Control", "no-store");
  return res.send(storedAudio.buffer);
});

// Twilio webhook for incoming calls
app.post("/incoming-call", async (req, res) => {
  try {
    const twiml = await handleIncomingCall(req);
    res.type("text/xml");
    return res.send(twiml);
  } catch (error) {
    console.error("Error in /incoming-call:", error);
    return res.status(500).send("Internal server error");
  }
});

// Twilio webhook for processing speech
app.post("/process-speech", async (req, res) => {
  try {
    const twiml = await processSpeech(req);
    res.type("text/xml");
    return res.send(twiml);
  } catch (error) {
    console.error("Error in /process-speech:", error);
    return res.status(500).send("Internal server error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Voice assistant backend listening on port ${PORT}`);
});

// Cleanup expired audio files every minute
setInterval(cleanupExpiredAudio, 60 * 1000);
