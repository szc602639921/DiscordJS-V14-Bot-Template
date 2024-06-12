const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { time } = require('../../../functions');
const axios = require('axios');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('video')
        .setDescription('Generate Video')
        .addAttachmentOption(option => {
            return option.setName("video")
            .setDescription('the file to upload')
            .setRequired(true)
          })
        .addStringOption(option => {
            return option.setName("duration")
                .setDescription('Select the video duration')
                .setRequired(true)
                .addChoices(
                    { name: "3 Seconds", value: "36" },
                    { name: "5 Seconds", value: "60" },
                    { name: "8 Seconds", value: "96" },
                )
        })
        .addStringOption(option => {
            return option.setName("styles")
                .setDescription('Select the video duration')
                .setRequired(true)
                .addChoices(
                    { name: "anime origin", value: "anime_normal_v2_api" },
                    { name: "anime origin pro", value: "anime_normal_v2_api_1024_pro" },
                    { name: "anime fashion", value: "anime_fashion_v10_api" },
                    { name: "anime cute", value: "anime_cute_v10_api" },
                    { name: "anime ghibli", value: "anime_ghibli_v10_api" },
                )
        })
        .addStringOption(option => {
            return option.setName("simlarity")
                .setDescription('Select the video duration')
                .setRequired(true)
                .addChoices(
                    { name: "more style please", value: "0" },
                    { name: "in the middle", value: "0.3" },
                    { name: "high", value: "0.6" },
                    
                    
                )
        })
        .addStringOption(option => {
            return option.setName("prompt")
                .setDescription('describe the video')
                .setRequired(true)
        })
        ,
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        await interaction.deferReply();
        /** Fetch the video file from Discord */
        const videoAttachment = interaction.options.getAttachment("video");
        const videoUrl = videoAttachment.url;
        const videoPath = `./tmp/${videoAttachment.name}`;

        /** Fetch the video file from Discord */
        const duration = interaction.options.getString("duration");

        /** Fetch orientation */
        const styles = interaction.options.getString("styles");

        /** Fetch prompt */
        const prompt = interaction.options.getString("prompt");

        /** Fetch prompt */
        const simlarity = interaction.options.getString("simlarity");

        const makeApiRequest  = async (videoUrl, prompt) => {
            const payload = JSON.stringify({
              input: {
                workflow: styles,
                payload: {
                  video: videoUrl,
                  seed: 125,
                  prompt: prompt,
                  negative_prompt: "",
                  frame_load_cap:  Number(duration),
                  strength: Number(simlarity)
                },
                policy: {
                  executionTimeout: 3600000,
                  lowPriority: false,
                  ttl: 43200000
                }
              },
              webhook: "localhost:8000/webhook"
            });
    
            const response = await axios.post("https://api.runpod.ai/v2/5h6dysiu8x781s/run", payload, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.RUNPOD_TOKEN
              }
            });
            
    
            return response.data.id;
          };

        const checkApiStatus = async (id, timeout = 3000000) => { // timeout in milliseconds
            const statusUrl = `https://api.runpod.ai/v2/5h6dysiu8x781s/status/${id}`;
            const startTime = Date.now();
            do {
              const statusResponse = await axios.get(statusUrl, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': process.env.RUNPOD_TOKEN
                }
              });
              console.log(statusResponse)
              let created_video_url
              try{
                created_video_url = JSON.parse(statusResponse.data.output).url
              } catch(e){
                created_video_url = false
              }
    
              if (created_video_url && created_video_url.length > 1) {
                return JSON.parse(statusResponse.data.output).url;
              }
    
              await new Promise(resolve => setTimeout(resolve, 5000)); // wait for 5 seconds before checking again
            } while (Date.now() - startTime < timeout);
    
            throw new Error('Processing did not complete within the specified timeout');
        };

        const videoId = await makeApiRequest(videoUrl, prompt);
        //const videoId = "28fcecd4-c4cc-4b75-a304-ef1d200b7e1f-e1"
        const processedVideoUrl = await checkApiStatus(videoId);

        
        return  interaction.editReply({
            files: [processedVideoUrl,videoUrl],
        });

    }
};
