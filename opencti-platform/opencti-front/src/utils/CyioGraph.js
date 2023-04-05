import * as R from 'ramda';
import SpriteText from 'three-spritetext';
import { truncate } from './String';
import { itemColor } from './Colors';
import themeDark from '../components/ThemeDark';
import {
  dateFormat,
  dayEndDate,
  daysAfter,
  daysAgo,
  jsDate,
  minutesBefore,
  minutesBetweenDates,
  timestamp,
} from './Time';
import { isNone } from '../components/i18n';
import informationSystem from '../resources/images/entities/graph-information-system.svg';
import adversaryIdentity from '../resources/images/entities/graph-adversary-identity.svg';
import appliance from '../resources/images/entities/graph-appliance.svg';
import applicationSoftware from '../resources/images/entities/graph-application-software.svg';
import attackPattern from '../resources/images/entities/graph-attack-pattern.svg';
import autonomousSystem from '../resources/images/entities/graph-autonomous-system.svg';
import bundle from '../resources/images/entities/graph-bundle.svg';
import campaign from '../resources/images/entities/graph-campaign.svg';
import coa from '../resources/images/entities/graph-coa.svg';
import component from '../resources/images/entities/graph-component.svg';
import computeDevice from '../resources/images/entities/graph-compute-device.svg';
import database from '../resources/images/entities/graph-database.svg';
import directoryServer from '../resources/images/entities/graph-directory-server.svg';
import dnsServer from '../resources/images/entities/graph-dns-server.svg';
import documentIcon from '../resources/images/entities/graph-document.svg';
import domainName from '../resources/images/entities/graph-domain-name.svg';
import emailAddress from '../resources/images/entities/graph-email-address.svg';
import emailMessage from '../resources/images/entities/graph-email-message.svg';
import emailServer from '../resources/images/entities/graph-email-server.svg';
import embeddedDevice from '../resources/images/entities/graph-embedded-device.svg';
import externalReferences from '../resources/images/entities/graph-external-references.svg';
import firewall from '../resources/images/entities/graph-firewall.svg';
import groupingRound from '../resources/images/entities/graph-grouping-round.svg';
import guidance from '../resources/images/entities/graph-guidance.svg';
import hardware from '../resources/images/entities/graph-hardware.svg';
import http from '../resources/images/entities/graph-http.svg';
import hypervisor from '../resources/images/entities/graph-hypervisor.svg';
import identity from '../resources/images/entities/graph-identity.svg';
import indicator from '../resources/images/entities/graph-indicator.svg';
import informationType from '../resources/images/entities/graph-information-type.svg';
import interconnection from '../resources/images/entities/graph-interconnection.svg';
import intrusionSet from '../resources/images/entities/graph-intrusion-set.svg';
import inventoryItem from '../resources/images/entities/graph-inventory-item.svg';
import ipAddress from '../resources/images/entities/graph-ip-address.svg';
import ipv4Address from '../resources/images/entities/graph-ipv4-address.svg';
import ipv6Address from '../resources/images/entities/graph-ipv6-address.svg';
import labels from '../resources/images/entities/graph-labels.svg';
import language from '../resources/images/entities/graph-language.svg';
import laptop from '../resources/images/entities/graph-laptop.svg';
import loadBalancer from '../resources/images/entities/graph-load-balancer.svg';
import location from '../resources/images/entities/graph-location.svg';
import macAddress from '../resources/images/entities/graph-mac-address.svg';
import malwareAnalysis from '../resources/images/entities/graph-malware-analysis.svg';
import malware from '../resources/images/entities/graph-malware.svg';
import mobileDevice from '../resources/images/entities/graph-mobile-device.svg';
import networkDevice from '../resources/images/entities/graph-network-device.svg';
import network from '../resources/images/entities/graph-network.svg';
import note from '../resources/images/entities/graph-note.svg';
import notes from '../resources/images/entities/graph-notes.svg';
import observedData from '../resources/images/entities/graph-observed-data.svg';
import operatingSystem from '../resources/images/entities/graph-operating-system.svg';
import opinion from '../resources/images/entities/graph-opinion.svg';
import pbx from '../resources/images/entities/graph-pbx.svg';
import plan from '../resources/images/entities/graph-plan.svg';
import policy from '../resources/images/entities/graph-policy.svg';
import printer from '../resources/images/entities/graph-printer.svg';
import procedure from '../resources/images/entities/graph-procedure.svg';
import relationship from '../resources/images/entities/graph-relationship.svg';
import report from '../resources/images/entities/graph-report.svg';
import resource from '../resources/images/entities/graph-resource.svg';
import router from '../resources/images/entities/graph-router.svg';
import server from '../resources/images/entities/graph-server.svg';
import services from '../resources/images/entities/graph-services.svg';
import sighting from '../resources/images/entities/graph-sighting.svg';
import software from '../resources/images/entities/graph-software.svg';
import source from '../resources/images/entities/graph-source.svg';
import standard from '../resources/images/entities/graph-standard.svg';
import storageArray from '../resources/images/entities/graph-storage-array.svg';
import subjectTypes from '../resources/images/entities/graph-subject-types.svg';
import system from '../resources/images/entities/graph-system.svg';
import threatActor from '../resources/images/entities/graph-threat-actor.svg';
import tlpAmber from '../resources/images/entities/graph-tlp-amber.svg';
import tlpGreen from '../resources/images/entities/graph-tlp-green.svg';
import tlpRestricted from '../resources/images/entities/graph-tlp-restricted.svg';
import tlpWhite from '../resources/images/entities/graph-tlp-white.svg';
import tool from '../resources/images/entities/graph-tool.svg';
import userAccount from '../resources/images/entities/graph-user-account.svg';
import validation from '../resources/images/entities/graph-validation.svg';
import victimTarget from '../resources/images/entities/graph-victim-target.svg';
import victim from '../resources/images/entities/graph-victim.svg';
import voipDevice from '../resources/images/entities/graph-voip-device.svg';
import voipHandset from '../resources/images/entities/graph-voip-handset.svg';
import voipRouter from '../resources/images/entities/graph-voip-router.svg';
import vulnerabilities from '../resources/images/entities/graph-vulnerabilities.svg';
import vulnerability from '../resources/images/entities/graph-vulnerability.svg';
import webServer from '../resources/images/entities/graph-web-server.svg';
import wirelessAccessPoint from '../resources/images/entities/graph-wireless-access-point.svg';
import workstation from '../resources/images/entities/graph-workstation.svg';
import switchIcon from '../resources/images/entities/graph-switch.svg';

const genImage = (src) => {
  const img = new Image();
  img.src = src;
  return img;
};

export const graphImages = {
  'information-system': genImage(informationSystem),
  'adversary-identity': genImage(adversaryIdentity),
  appliance: genImage(appliance),
  'application-software': genImage(applicationSoftware),
  'attack-pattern': genImage(attackPattern),
  'autonomous-system': genImage(autonomousSystem),
  bundle: genImage(bundle),
  campaign: genImage(campaign),
  coa: genImage(coa),
  'compute-device': genImage(computeDevice),
  database: genImage(database),
  'directory-server': genImage(directoryServer),
  'dns-server': genImage(dnsServer),
  document: genImage(documentIcon),
  'domain-name': genImage(domainName),
  'email-address': genImage(emailAddress),
  'email-message': genImage(emailMessage),
  'email-server': genImage(emailServer),
  'embedded-device': genImage(embeddedDevice),
  'external-references': genImage(externalReferences),
  firewall: genImage(firewall),
  'grouping-round': genImage(groupingRound),
  guidance: genImage(guidance),
  hardware: genImage(hardware),
  http: genImage(http),
  hypervisor: genImage(hypervisor),
  identity: genImage(identity),
  indicator: genImage(indicator),
  'information-type': genImage(informationType),
  interconnection: genImage(interconnection),
  'intrusion-set': genImage(intrusionSet),
  'ip-address': genImage(ipAddress),
  'ipv4-address': genImage(ipv4Address),
  'ipv6-address': genImage(ipv6Address),
  labels: genImage(labels),
  language: genImage(language),
  laptop: genImage(laptop),
  component: genImage(component),
  'load-balancer': genImage(loadBalancer),
  location: genImage(location),
  'mac-address': genImage(macAddress),
  'malware-analysis': genImage(malwareAnalysis),
  malware: genImage(malware),
  'mobile-device': genImage(mobileDevice),
  'network-device': genImage(networkDevice),
  network: genImage(network),
  note: genImage(note),
  notes: genImage(notes),
  'observed-data': genImage(observedData),
  'operating-system': genImage(operatingSystem),
  opinion: genImage(opinion),
  pbx: genImage(pbx),
  plan: genImage(plan),
  policy: genImage(policy),
  printer: genImage(printer),
  procedure: genImage(procedure),
  relationship: genImage(relationship),
  report: genImage(report),
  resource: genImage(resource),
  router: genImage(router),
  server: genImage(server),
  services: genImage(services),
  sighting: genImage(sighting),
  software: genImage(software),
  source: genImage(source),
  standard: genImage(standard),
  'storage-array': genImage(storageArray),
  'subject-types': genImage(subjectTypes),
  'oscal-leveraged-authorization': genImage(software),
  system: genImage(system),
  'threat-actor': genImage(threatActor),
  'tlp-amber': genImage(tlpAmber),
  'tlp-green': genImage(tlpGreen),
  'tlp-restricted': genImage(tlpRestricted),
  'tlp-white': genImage(tlpWhite),
  tool: genImage(tool),
  'user-account': genImage(userAccount),
  validation: genImage(validation),
  'victim-target': genImage(victimTarget),
  victim: genImage(victim),
  'voip-device': genImage(voipDevice),
  'voip-handset': genImage(voipHandset),
  'voip-router': genImage(voipRouter),
  vulnerabilities: genImage(vulnerabilities),
  'web-server': genImage(webServer),
  vulnerability: genImage(vulnerability),
  'wireless-access-point': genImage(wirelessAccessPoint),
  workstation: genImage(workstation),
  switch: genImage(switchIcon),
  'inventory-item': genImage(inventoryItem),
};

export const graphRawImages = {
  appliance,
  bundle,
  campaign,
  coa,
  database,
  firewall,
  guidance,
  hardware,
  http,
  hypervisor,
  identity,
  indicator,
  opinion,
  pbx,
  plan,
  policy,
  printer,
  component,
  procedure,
  relationship,
  report,
  resource,
  router,
  system,
  server,
  services,
  sighting,
  software,
  labels,
  tool,
  language,
  validation,
  laptop,
  victim,
  source,
  standard,
  location,
  malware,
  network,
  note,
  notes,
  workstation,
  vulnerability,
  interconnection,
  vulnerabilities,
  switch: switchIcon,
  document: documentIcon,
  'oscal-leveraged-authorization': software,
  'information-type': informationType,
  'intrusion-set': intrusionSet,
  'ip-address': ipAddress,
  'ipv4-address': ipv4Address,
  'ipv6-address': ipv6Address,
  'load-balancer': loadBalancer,
  'mac-address': macAddress,
  'adversary-identity': adversaryIdentity,
  'information-system': informationSystem,
  'application-software': applicationSoftware,
  'attack-pattern': attackPattern,
  'autonomous-system': autonomousSystem,
  'compute-device': computeDevice,
  'directory-server': directoryServer,
  'dns-server': dnsServer,
  'domain-name': domainName,
  'email-address': emailAddress,
  'email-message': emailMessage,
  'email-server': emailServer,
  'embedded-device': embeddedDevice,
  'external-references': externalReferences,
  'grouping-round': groupingRound,
  'malware-analysis': malwareAnalysis,
  'mobile-device': mobileDevice,
  'network-device': networkDevice,
  'observed-data': observedData,
  'operating-system': operatingSystem,
  'storage-array': storageArray,
  'subject-types': subjectTypes,
  'threat-actor': threatActor,
  'tlp-amber': tlpAmber,
  'tlp-green': tlpGreen,
  'tlp-restricted': tlpRestricted,
  'tlp-white': tlpWhite,
  'user-account': userAccount,
  'victim-target': victimTarget,
  'voip-device': voipDevice,
  'voip-handset': voipHandset,
  'voip-router': voipRouter,
  'web-server': webServer,
  'wireless-access-point': wirelessAccessPoint,
  'inventory-item': inventoryItem,
};

export const graphLevel = {
  'Kill-Chain-Phase': 1,
  'Attack-Pattern': 1,
  Campaign: 1,
  Note: 1,
  'Observed-Data': 1,
  Opinion: 1,
  Report: 1,
  'Course-Of-Action': 1,
  Individual: 1,
  Organization: 1,
  Sector: 1,
  System: 1,
  Indicator: 1,
  Infrastructure: 1,
  'Intrusion-Set': 1,
  City: 1,
  Country: 1,
  Region: 1,
  Position: 1,
  Malware: 1,
  'Threat-Actor': 1,
  Tool: 1,
  Vulnerability: 1,
  Incident: 1,
  'Autonomous-System': 1,
  Directory: 1,
  'Domain-Name': 1,
  'Email-Addr': 1,
  'Email-Message': 1,
  'Email-Mime-Part-Type': 1,
  Artifact: 1,
  StixFile: 1,
  'X509-Certificate': 1,
  'IPv4-Addr': 1,
  'IPv6-Addr': 1,
  'Mac-Addr': 1,
  Mutex: 1,
  'Network-Traffic': 1,
  Process: 1,
  Software: 1,
  'User-Account': 1,
  Url: 1,
  'Windows-Registry-Key': 1,
  'Windows-Registry-Value-Type': 1,
  'X509-V3-Extensions-Type': 1,
  'X-OpenCTI-Cryptographic-Key': 1,
  'X-OpenCTI-Cryptocurrency-Wallet': 1,
  'X-OpenCTI-Hostname': 1,
  'X-OpenCTI-User-Agent': 1,
  'X-OpenCTI-Text': 1,
  relationship: 1,
};

export const encodeGraphData = (graphData) => Buffer.from(JSON.stringify(graphData), 'ascii').toString('base64');

export const decodeGraphData = (encodedGraphData) => {
  if (encodedGraphData) {
    const decodedGraphData = JSON.parse(
      Buffer.from(encodedGraphData, 'base64').toString('ascii'),
    );
    if (typeof decodedGraphData === 'object') {
      return decodedGraphData;
    }
  }
  return {};
};

export const defaultDate = (n) => {
  if (!n) return '';
  if (!isNone(n.start_time)) {
    return n.start_time;
  }
  if (!isNone(n.first_seen)) {
    return n.first_seen;
  }
  if (!isNone(n.first_observed)) {
    return n.first_observed;
  }
  if (!isNone(n.valid_from)) {
    return n.valid_from;
  }
  if (!isNone(n.published)) {
    return n.published;
  }
  if (!isNone(n.created)) {
    return n.created;
  }
  if (!isNone(n.created_at)) {
    return n.created_at;
  }
  return null;
};

export const defaultValue = (n, tooltip = false) => {
  if (!n) return '';
  if (tooltip) {
    return `${n.x_mitre_id ? `[${n.x_mitre_id}] ` : ''}${n.name
      || n.label
      || n.observable_value
      || n.attribute_abstract
      || n.opinion
      || n.value
      || n.name
      || n.title
      || n.definition
      || n.source_name
      || n.system_name
      || n.phase_name
      || defaultValue(R.head(R.pathOr([], ['objects', 'edges'], n))?.node)
      || 'Unknown'}`;
  }
  return `${n.x_mitre_id ? `[${n.x_mitre_id}] ` : ''}${n.name
    || n.label
    || n.observableName
    || n.observable_value
    || n.attribute_abstract
    || n.opinion
    || n.value
    || n.name
    || n.title
    || n.definition
    || n.system_name
    || n.source_name
    || n.phase_name
    || defaultValue(R.head(R.pathOr([], ['objects', 'edges'], n))?.node)
    || 'Unknown'}`;
};

export const computeTimeRangeInterval = (objects) => {
  const elementsDates = R.map((n) => defaultDate(n), objects);
  const orderedElementsDate = R.sort(
    (a, b) => timestamp(a) - timestamp(b),
    R.filter((n) => !R.isNil(n) && !isNone(n), elementsDates),
  );
  let startDate = jsDate(daysAgo(1));
  let endDate = jsDate(dayEndDate());
  if (orderedElementsDate.length >= 1) {
    startDate = jsDate(daysAgo(1, orderedElementsDate[0]));
    endDate = jsDate(daysAfter(1, orderedElementsDate[0]));
  }
  if (orderedElementsDate.length >= 2) {
    endDate = jsDate(daysAfter(1, orderedElementsDate.slice(-1)[0]));
  }
  return [startDate, endDate];
};

export const computeTimeRangeValues = (interval, objects) => {
  const elementsDates = R.map(
    (n) => timestamp(defaultDate(n)),
    R.filter(
      (n) => n.parent_types && !n.parent_types.includes('basic-relationship'),
      objects,
    ),
  );
  const minutes = minutesBetweenDates(interval[0], interval[1]);
  const intervalInMinutes = Math.ceil(minutes / 100);
  const intervalInSecondes = intervalInMinutes * 60;
  const intervals = Array(100)
    .fill()
    .map((_, i) => timestamp(minutesBefore(minutes - i * intervalInMinutes, interval[1])));
  return R.map(
    (n) => ({
      time: n,
      index: 1,
      value: R.filter(
        (o) => o >= n && o <= n + intervalInSecondes,
        elementsDates,
      ).length,
    }),
    intervals,
  );
};

export const applyNodeFilters = (
  nodesData,
  stixCoreObjectsTypes = [],
  markedBy = [],
  createdBy = [],
  excludedStixCoreObjectsTypes = [],
  interval = [],
) => {
  const nodes = R.pipe(
    R.filter(
      (n) => excludedStixCoreObjectsTypes.length === 0
        || !R.includes(n.entity_type, excludedStixCoreObjectsTypes),
    ),
    R.filter(
      (n) => stixCoreObjectsTypes.length === 0
        || R.includes(n.entity_type, stixCoreObjectsTypes),
    ),
    R.filter(
      (n) => markedBy.length === 0
        || !n.markedBy
        || R.any((m) => R.includes(m.id, markedBy), n.markedBy),
    ),
    R.filter(
      (n) => createdBy.length === 0 || R.includes(n.createdBy.id, createdBy),
    ),
    R.filter(
      (n) => interval.length === 0
        || isNone(n.defaultDate)
        || (n.defaultDate >= interval[0] && n.defaultDate <= interval[1]),
    ),
  )(nodesData);
  return nodes;
};

export const applyFilters = (
  graphData,
  stixCoreObjectsTypes = [],
  markedBy = [],
  createdBy = [],
  excludedStixCoreObjectsTypes = [],
  interval = [],
) => {
  const nodes = applyNodeFilters(
    graphData.nodes,
    stixCoreObjectsTypes,
    markedBy,
    createdBy,
    excludedStixCoreObjectsTypes,
    interval,
  );
  const nodeIds = R.map((n) => n.id, nodes);
  const links = R.pipe(
    R.filter(
      (n) => R.includes(n.source_id, nodeIds) && R.includes(n.target_id, nodeIds),
    ),
  )(graphData.links);
  return {
    nodes,
    links,
  };
};

export const buildCorrelationData = (objects, graphData, t, filterAdjust) => {
  const thisReportLinkNodes = R.pipe(
    R.filter((n) => n.reports && n.parent_types && n.reports.edges.length > 1),
  )(
    applyNodeFilters(
      R.filter((o) => o && o.id && o.entity_type && o.reports, objects),
      filterAdjust.stixCoreObjectsTypes,
      filterAdjust.markedBy,
      filterAdjust.createdBy,
      [],
      filterAdjust.selectedTimeRangeInterval,
    ),
  );
  const relatedReportNodes = applyNodeFilters(
    R.pipe(
      R.map((n) => n.reports.edges),
      R.flatten,
      R.map((n) => n.node),
      R.uniqBy(R.prop('id')),
      R.map((n) => (n.defaultDate ? { ...n } : { ...n, defaultDate: jsDate(defaultDate(n)) })),
    )(thisReportLinkNodes),
    [],
    filterAdjust.markedBy,
    filterAdjust.createdBy,
    [],
    filterAdjust.selectedTimeRangeInterval,
  );
  const links = R.pipe(
    R.map((n) => R.map(
      (e) => ({
        id: R.concat(n.id, '-', e.id),
        parent_types: ['basic-relationship'],
        entity_type: 'basic-relationship',
        relationship_type: 'reported-in',
        source: n.id,
        target: e.id,
        label: '',
        name: '',
        source_id: n.id,
        target_id: e.id,
        from: n.id,
        to: n.id,
        start_time: '',
        stop_time: '',
        defaultDate: jsDate(defaultDate(n)),
      }),
      relatedReportNodes,
    )),
    R.flatten,
  )(thisReportLinkNodes);
  const combinedNodes = R.concat(thisReportLinkNodes, relatedReportNodes);
  const nodes = R.pipe(
    R.map((n) => ({
      id: n.id,
      val: graphLevel[n.entity_type],
      name: defaultValue(n, true),
      defaultDate: jsDate(defaultDate(n)),
      label: truncate(
        defaultValue(n),
        n.entity_type === 'Attack-Pattern' ? 30 : 20,
      ),
      img: graphImages[n.entity_type],
      entity_type: n.entity_type,
      rawImg: graphRawImages[n.entity_type],
      color: n.x_opencti_color || n.color || itemColor(n.entity_type, false),
      parent_types: n.parent_types,
      isObservable: !!n.observable_value,
      markedBy: R.map(
        (m) => ({ id: m.node.id, definition: m.node.definition }),
        R.pathOr([], ['objectMarking', 'edges'], n),
      ),
      createdBy: n.createdBy
        ? n.createdBy
        : { id: '0533fcc9-b9e8-4010-877c-174343cb24cd', name: 'Unknown' },
      fx: graphData[n.id] && graphData[n.id].x ? graphData[n.id].x : null,
      fy: graphData[n.id] && graphData[n.id].y ? graphData[n.id].y : null,
    })),
  )(combinedNodes);

  return {
    nodes,
    links,
  };
};

export const buildGraphData = (objects, graphData, t) => {
  const relationshipsIdsInNestedRelationship = R.pipe(
    R.filter(
      (n) => n.source && n.target && n.relationship_type,
    ),
    R.map((n) => (n.target)),
  )(objects);
  const nodes = R.pipe(
    R.filter(
      (n) => !n.relationship_type,
    ),
    R.uniqBy(R.prop('id')),
    R.map((n) => ({
      id: n.id,
      val: graphLevel[n.entity_type] || 1,
      name: `${n.relationship_type
        ? `<strong>${t(`relationship_${n.relationship_type}`)}</strong>}`
        : defaultValue(n, true)}`,
      defaultDate: jsDate(defaultDate(n)),
      label: n.relationship_type
        ? t(`relationship_${n.relationship_type}`)
        : truncate(
          defaultValue(n),
          20,
        ),
      img: graphImages[n.entity_type],
      rawImg: graphRawImages[n.entity_type],
      color: itemColor(n.entity_type, false),
      entity_type: n.entity_type,
      markedBy: R.map(
        (m) => ({ id: m.node.id }),
        R.pathOr([], ['objects', 'edges'], n),
      ),
      createdBy: n.created
        ? n.created
        : { id: '0533fcc9-b9e8-4010-877c-174343cb24cd', name: 'Unknown' },
      fx: graphData[n.id] && graphData[n.id].x ? graphData[n.id].x : null,
      fy: graphData[n.id] && graphData[n.id].y ? graphData[n.id].y : null,
    })),
  )(objects);
  const links = R.pipe(
    R.filter(
      (n) => !R.includes(n.id, relationshipsIdsInNestedRelationship)
        && n.source
        && n.target,
    ),
    R.uniqBy(R.prop('id')),
    R.map((n) => ({
      id: n.id,
      // parent_types: n.parent_types,
      entity_type: n.entity_type,
      relationship_type: n.relationship_type,
      source: n.source.id,
      target: n.target.id,
      label: n.relationship_type,
      name: n.relationship_type,
      source_id: n.source.id,
      target_id: n.target.id,
      // inferred: n.inferred,
      defaultDate: jsDate(defaultDate(n)),
    })),
  )(objects);
  return {
    nodes,
    links,
  };
};

export const nodePaint = (
  {
    // eslint-disable-next-line camelcase
    label,
    img,
    x,
    y,
  },
  color,
  ctx,
  selected = false,
) => {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, 5, 0, 2 * Math.PI, false);
  ctx.fill();
  if (selected) {
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = themeDark().palette.secondary.main;
    ctx.stroke();
  }
  const size = 8;
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  ctx.font = '4px Roboto';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 10);
};

export const nodeAreaPaint = ({ name, x, y }, color, ctx) => {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, 5, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.font = '4px Roboto';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x, y + 10);
};

export const linkPaint = (link, ctx, color) => {
  const start = link.source;
  const end = link.target;
  if (typeof start !== 'object' || typeof end !== 'object') return;
  const textPos = Object.assign(
    ...['x', 'y'].map((c) => ({
      [c]: start[c] + (end[c] - start[c]) / 2,
    })),
  );
  const relLink = { x: end.x - start.x, y: end.y - start.y };
  let textAngle = Math.atan2(relLink.y, relLink.x);
  if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
  if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);
  const fontSize = 3;
  ctx.font = `${fontSize}px Roboto`;
  ctx.save();
  ctx.translate(textPos.x, textPos.y);
  ctx.rotate(textAngle);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(link.label, 0, 0);
  ctx.restore();
};

export const nodeThreePaint = (node, color) => {
  const sprite = new SpriteText(node.label);
  sprite.color = color;
  sprite.textHeight = 1.5;
  return sprite;
};

export const parseDomain = (data) => [
  0,
  Math.max.apply(
    null,
    data.map((entry) => entry.value),
  ),
];
