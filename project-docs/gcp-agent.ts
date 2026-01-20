#!/usr/bin/env node

/**
 * GCP-Powered Terminal AI Agent
 * Uses your $410 GCP credits via Vertex AI
 * No rate limits - just pay per token
 */

import { VertexAI } from '@google-cloud/vertexai';
import readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';

// Configuration
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
const LOCATION = 'us-central1';
const MODEL = 'gemini-1.5-pro'; // or 'gemini-pro'

// Initialize Vertex AI
const vertexAI = new VertexAI({
    project: PROJECT_ID,
    location: LOCATION,
});

// Conversation history
let conversationHistory: any[] = [];

// System prompt
const SYSTEM_PROMPT = `You are a helpful AI coding assistant running locally via GCP Vertex AI. 
You help with code review, debugging, architecture decisions, and implementation.
You have access to the user's local filesystem and can help with their projects.
Be concise but thorough. Format code with proper syntax highlighting hints.`;

async function chat(userMessage: string): Promise<string> {
    const spinner = ora('Thinking...').start();

    try {
        const model = vertexAI.preview.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.7,
                topP: 0.95,
            },
        });

        // Build conversation context
        const contents = [
            {
                role: 'user',
                parts: [{ text: SYSTEM_PROMPT }]
            },
            ...conversationHistory,
            {
                role: 'user',
                parts: [{ text: userMessage }]
            }
        ];

        const result = await model.generateContent({ contents });
        const response = result.response.text();

        // Update history
        conversationHistory.push(
            { role: 'user', parts: [{ text: userMessage }] },
            { role: 'model', parts: [{ text: response }] }
        );

        // Keep history manageable (last 20 exchanges)
        if (conversationHistory.length > 40) {
            conversationHistory = conversationHistory.slice(-40);
        }

        spinner.stop();
        return response;

    } catch (error: any) {
        spinner.stop();
        return chalk.red(`Error: ${error.message}`);
    }
}

async function executeCommand(command: string): Promise<string> {
    const cmd = command.toLowerCase().trim();

    // Special commands
    if (cmd === '/clear') {
        conversationHistory = [];
        console.clear();
        return chalk.green('Conversation history cleared!');
    }

    if (cmd === '/history') {
        return JSON.stringify(conversationHistory, null, 2);
    }

    if (cmd === '/save') {
        const filename = `conversation-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(conversationHistory, null, 2));
        return chalk.green(`Conversation saved to ${filename}`);
    }

    if (cmd === '/help') {
        return `
${chalk.bold('Available Commands:')}
${chalk.cyan('/clear')}   - Clear conversation history
${chalk.cyan('/history')} - Show conversation history
${chalk.cyan('/save')}    - Save conversation to file
${chalk.cyan('/help')}    - Show this help
${chalk.cyan('/exit')}    - Exit the agent
${chalk.cyan('/cost')}    - Show estimated cost

Or just type your question!
    `;
    }

    if (cmd === '/cost') {
        // Rough cost estimation
        const totalTokens = conversationHistory.reduce((acc, msg) => {
            const text = msg.parts[0].text;
            return acc + text.length / 4; // rough estimate: 1 token ≈ 4 chars
        }, 0);

        const costPer1MTokens = 0.125; // $0.125 per 1M input tokens for Gemini Pro
        const estimatedCost = (totalTokens / 1000000) * costPer1MTokens;

        return `
${chalk.bold('Cost Estimate:')}
Total tokens (estimated): ${Math.round(totalTokens)}
Estimated cost so far: $${estimatedCost.toFixed(6)}
Remaining credits: $${(410 - estimatedCost).toFixed(2)}
    `;
    }

    if (cmd === '/exit' || cmd === 'exit' || cmd === 'quit') {
        console.log(chalk.yellow('\nGoodbye! 👋\n'));
        process.exit(0);
    }

    return '';
}

async function main() {
    console.clear();
    console.log(chalk.bold.cyan('\n🤖 GCP-Powered AI Agent\n'));
    console.log(chalk.gray('Powered by Vertex AI using your $410 GCP credits'));
    console.log(chalk.gray('Type /help for commands, /exit to quit\n'));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.bold.green('You: ')
    });

    rl.prompt();

    rl.on('line', async (input: string) => {
        const trimmedInput = input.trim();

        if (!trimmedInput) {
            rl.prompt();
            return;
        }

        // Check for special commands
        if (trimmedInput.startsWith('/')) {
            const result = await executeCommand(trimmedInput);
            if (result) console.log('\n' + result + '\n');
            rl.prompt();
            return;
        }

        // Regular chat
        const response = await chat(trimmedInput);
        console.log('\n' + chalk.bold.blue('Agent: ') + response + '\n');
        rl.prompt();
    });

    rl.on('close', () => {
        console.log(chalk.yellow('\nGoodbye! 👋\n'));
        process.exit(0);
    });
}

// Handle errors
process.on('uncaughtException', (error) => {
    console.error(chalk.red('\nError:'), error.message);
    process.exit(1);
});

main();
