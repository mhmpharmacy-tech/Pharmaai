import { matchIranianPackage, type ObservedPackageText } from './iranPackageMatching';
import { IRAN_MARKET_PRODUCT_EXEMPLARS } from '../data/iranManufacturerProducts';

/**
 * The human ground truth must come from separately confirmed original packaging,
 * not from the same AI response being evaluated.
 * Observations are saved outputs of a real image inference pass.
 */
export interface IranPackageEvaluationCase {
  id:string;
  imageId:string;
  datasetSplit:'evaluation';
  packageRevision:string;
  expectedProductId:string|null;
  observed:ObservedPackageText;
}

export interface IranRecognitionMetrics {
  total:number;
  knownProducts:number;
  unknownProducts:number;
  accepted:number;
  abstained:number;
  correctAccepted:number;
  incorrectAccepted:number;
  wrongStrengthAccepted:number;
  wrongManufacturerAccepted:number;
  unknownAccepted:number;
  confusion:Array<{caseId:string;imageId:string;expected:string|null;predicted:string|null;status:string}>;
  precisionAccepted:number|null;
  recallKnown:number|null;
  coverage:number|null;
  abstentionRate:number|null;
  wrongStrengthFalseAcceptRate:number|null;
  unknownFalseAcceptRate:number|null;
}

/** Returns null instead of lying about metrics with no denominator. */
function safeRate(numerator:number,denominator:number):number|null {
  return denominator ? numerator/denominator : null;
}

export function evaluateIranPackaging(
  cases:readonly IranPackageEvaluationCase[],
):IranRecognitionMetrics {
  const ids=new Set<string>(), imageIds=new Set<string>();
  const confusion:IranRecognitionMetrics['confusion']=[];
  let knownProducts=0,unknownProducts=0,accepted=0,abstained=0;
  let correctAccepted=0,incorrectAccepted=0,wrongStrengthAccepted=0;
  let wrongManufacturerAccepted=0,unknownAccepted=0;

  const productMap=new Map(IRAN_MARKET_PRODUCT_EXEMPLARS.map(p=>[p.id,p]));
  for(const item of cases) {
    if(!item.id?.trim() || !item.imageId?.trim())throw new Error('Every benchmark case needs a unique case ID and image ID');
    if(item.datasetSplit!=='evaluation')throw new Error('Evaluation case is not in the held-out evaluation split');
    if(!item.packageRevision?.trim())throw new Error('Product packaging revision must be recorded');
    if(ids.has(item.id)||imageIds.has(item.imageId))throw new Error('Duplicate case or image across evaluation set');
    ids.add(item.id);imageIds.add(item.imageId);
    const expected=item.expectedProductId;
    if(expected !== null && !productMap.has(expected))
      throw new Error('Unknown product ground-truth ID '+expected);
    const prediction=matchIranianPackage(item.observed);
    const predicted=prediction.status==='catalog-candidate' ? prediction.productId??null : null;
    if(expected===null)unknownProducts++;else knownProducts++;
    if(predicted!==null) {
      accepted++;
      if(expected===predicted)correctAccepted++;
      else{
        incorrectAccepted++;
        if(expected===null)unknownAccepted++;
        else{
          const actual=productMap.get(expected)!, p=productMap.get(predicted)!;
          if(actual.strengthLabel!==p.strengthLabel)wrongStrengthAccepted++;
          if(actual.manufacturerId!==p.manufacturerId)wrongManufacturerAccepted++;
        }
      }
    }else{
      abstained++;
    }
    confusion.push({caseId:item.id,imageId:item.imageId,expected,predicted,status:prediction.status});
  }
  return {
    total:cases.length,knownProducts,unknownProducts,accepted,abstained,
    correctAccepted,incorrectAccepted,wrongStrengthAccepted,
    wrongManufacturerAccepted,unknownAccepted,confusion,
    precisionAccepted:safeRate(correctAccepted,accepted),
    recallKnown:safeRate(correctAccepted,knownProducts),
    coverage:safeRate(accepted,cases.length),
    abstentionRate:safeRate(abstained,cases.length),
    wrongStrengthFalseAcceptRate:safeRate(wrongStrengthAccepted,knownProducts),
    unknownFalseAcceptRate:safeRate(unknownAccepted,unknownProducts),
  };
}
