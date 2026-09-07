/**                                                                                                                                                        
    * Checks required environment variables and throws an error if any are                                                                                    
 missing.                                                                                                                                                     
    * @throws {Error} with the names of the missing environment variables.                                                                                    
    */
function checkRequiredEnvVars(): void {
  // Define the required environment variables                            
  const requiredVars: string[] = [
    'PINECONE_INDEX',
    'PINECONE_API_KEY',
    'PINECONE_CLOUD',
    'OPENAI_API_KEY'
  ];

  // Collect the names of any missing environment variables               
  const missingVars: string[] = requiredVars.filter(varName =>
    !process.env[varName]);

  // If there are any missing variables, throw an error listing them      
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables:              
  ${missingVars.join(', ')}`);
  }
}

export default checkRequiredEnvVars;            
