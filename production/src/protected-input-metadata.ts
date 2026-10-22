// Source: ux-contracts/LB_THUNDER_V_HA.json (VERIFIED_RECOVERY) and the
// original distribution package. Persistence metadata is independent of the
// compact labels used by the new canonical counter UI.
const thunder:Record<string,any>={
 INP_PREDECESSOR_GAMES:{name:'着席時ゲーム数',category:'PREDECESSOR',displayOrder:1,observationScope:'PREDECESSOR_SNAPSHOT',sessionDifferenceHelper:false},
 INP_PREDECESSOR_BIG_COUNT:{name:'着席時BIG',category:'PREDECESSOR',displayOrder:2,observationScope:'PREDECESSOR_SNAPSHOT'},
 INP_PREDECESSOR_REG_COUNT:{name:'着席時REG',category:'PREDECESSOR',displayOrder:3,observationScope:'PREDECESSOR_SNAPSHOT'},
};
export const protectedInputMetadata=(machineId:string,inputId:string)=>machineId==='LB_THUNDER_V_HA'?thunder[inputId]:undefined;
