exports = async function() {
  // These are the parameters you want to filll
  const params =  {
    // The cluster we are monitoring
    CLUSTER_NAME : 'MyAtlasCluster',
    // Average for X minutes
    CONSIDER_LAST_X_MIN : 15,
    // Metrics can be found here: https://docs.atlas.mongodb.com/tutorial/monitoring-integrations/
    METRIC_TO_EVALUATE : 'PROCESS_NORMALIZED_CPU_USER',
    // 85%
    THRESHOLD_FOR_METRIC : 0.85 * 100 ,
    // Scale up to instance (if needed)
    SCALE_UP_TO: "M20"
  } ;
  
  // Get the secrets for project, and api credentialsl
  const projectID = context.values.get("MonitoringProjectId");
  const username  = context.values.get("AtlasPublicKey");
  const password  = context.values.get("AtlasPrivateKey");
  
  // Call function to retrieve the last X of metric Y for cluster Z (params.)
  result = await context.functions.execute('getClusterMetrics', 
                                                          username, password, 
                                                          projectID, 
                                                          params.CLUSTER_NAME, 
                                                          params.METRIC_TO_EVALUATE, 
                                                          params.CONSIDER_LAST_X_MIN );
  
  var processes_and_metrics = result.metrics;
  
  // We will have an object where processes are the key and as values the metrics
  for (var k in processes_and_metrics) {
    var measures = processes_and_metrics[k].dataPoints;

    var sum = 0,count = 0;
    
    measures.forEach(state => {
      if (! isNaN(state['value'])) {
        sum += state['value']
        count++;
      }
    });
    
    var avg_metric = sum / count;
    
    console.log("Value of metric " + params.METRIC_TO_EVALUATE +
                " for process '" + k + "' in cluster '" + params.CLUSTER_NAME +
                "' of the last '" + params.CONSIDER_LAST_X_MIN + "' minutes " +
                Math.ceil(avg_metric) + "%" );
  }
  
  
  // Check if we need to scale
  if (avg_metric < params.THRESHOLD_FOR_METRIC) {
    
    console.log("ALL OK - AVG of metric " + params.METRIC_TO_EVALUATE + 
                " is below the specified '" + params.THRESHOLD_FOR_METRIC + "'");
    
  } else {
  
    // Set the desired instance size...
    const body =    {
        "providerSettings" : {
          "instanceSizeName" : params.SCALE_UP_TO
        }
    };
    
    result = await context.functions.execute('modifyCluster', username, password, projectID, params.CLUSTER_NAME, body);
    console.log(EJSON.stringify(result));
    
    if (result.error) {
      return result;
    }
  
    return pararms.CLUSTER_NAME + " scaled up"; 
  }

  return null;
};
