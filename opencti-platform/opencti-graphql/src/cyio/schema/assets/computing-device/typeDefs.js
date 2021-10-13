import gql from 'graphql-tag' ;

const typeDefs = gql`
  extend type Query {
      computingDeviceAssetList(
          first: Int
          offset: Int
          orderedBy: ComputingDeviceAssetOrdering
          orderMode: OrderingMode
          filters: [ComputingDeviceAssetFiltering]
          filterMode: FilterMode
          search: String
        ): ComputingDeviceAssetConnection
      computingDeviceAsset(id: ID!): ComputingDeviceAsset
  }

  extend type Mutation {
      addComputingDeviceAsset(input: ComputingDeviceAssetAddInput): ComputingDeviceAsset
      deleteComputingDeviceAsset(id: ID!): String!
      editComputingDeviceAsset(id: ID!, input: [EditInput]!, commitMessage: String): ComputingDeviceAsset
  }

  "Defines identifying information about a network."
  type ComputingDeviceAsset implements BasicObject & LifecycleObject & CoreObject & Asset & ItAsset {
    # BasicObject
    "Uniquely identifies this object."
    id: ID!
    "Identifies the identifier defined by the standard."
    standard_id: String!
    "Identifies the type of the Object."
    entity_type: String!
    "Identifies the parent types of this object."
    parent_types: [String]!
    # CoreObject
    created: DateTime!
    modified: DateTime!
    labels: [String]
    # Asset
    asset_id: String
    name: String!
    description: String
    locations: [AssetLocation]
    external_references( first: Int ): CyioExternalReferenceConnection
    notes( first: Int ): CyioNoteConnection
    # ItAsset
    asset_tag: String
    asset_type: AssetType!
    serial_number: String
    vendor_name: String
    version: String
    release_date: DateTime
    implementation_point: ImplementationPoint!
    operational_status: OperationalStatus!
    # responsible_parties: [ResponsibleParty]
    # HardwareAsset
    cpe_identifier: String
    installation_id: String
    installed_hardware: [ComputingDeviceAsset!]!
    installed_operating_system: OperatingSystemAsset!
    model: String
    motherboard_id: String
    baseline_configuration_name: String
    function: String
    # Computing Device
    bios_id: String
    connected_to_network: NetworkAsset
    default_gateway: String
    fqdn: String
    hostname: String
    netbios_name: String
    installed_software: [SoftwareAsset!]!
    ip_address: [IpAddress!]!
    mac_address: [MAC!]!
    network_id: String
    vlan_id: String
    uri: URL
    ports: [PortInfo!]!
    is_publicly_accessible: Boolean
    is_scanned: Boolean
    is_virtual: Boolean
  }

  "Defines identifying information about infrastructure server device that perform generic computing capabilities."
  type Server implements BasicObject & LifecycleObject & CoreObject & Asset & ItAsset {
    # BasicObject
    "Uniquely identifies this object."
    id: ID!
    "Identifies the identifier defined by the standard."
    standard_id: String!
    "Identifies the type of the Object."
    entity_type: String!
    "Identifies the parent types of this object."
    parent_types: [String]!
    # CoreObject
    created: DateTime!
    modified: DateTime!
    labels: [String]
    # Asset
    asset_id: String
    name: String!
    description: String
    locations: [AssetLocation]
    external_references( first: Int ): CyioExternalReferenceConnection
    notes( first: Int ): CyioNoteConnection
    # ItAsset
    asset_tag: String
    asset_type: AssetType!
    serial_number: String
    vendor_name: String
    version: String
    release_date: DateTime
    implementation_point: ImplementationPoint!
    operational_status: OperationalStatus!
    # responsible_parties: [ResponsibleParty]
    # HardwareAsset
    cpe_identifier: String
    installation_id: String
    installed_hardware: [ComputingDeviceAsset!]!
    installed_operating_system: OperatingSystemAsset!
    model: String
    motherboard_id: String
    baseline_configuration_name: String
    function: String
    # Computing Device
    bios_id: String
    connected_to_network: NetworkAsset
    default_gateway: String
    fqdn: String
    hostname: String
    netbios_name: String
    installed_software: [SoftwareAsset!]!
    ip_address: [IpAddress!]!
    mac_address: [MAC!]!
    vlan_id: String
    uri: String
    ports: [PortInfo!]!
    is_publicly_accessible: Boolean
    is_scanned: Boolean
    is_virtual: Boolean
  }

  "Defines identifying information about a workstation that perform generic computing capabilities."
  type Workstation implements BasicObject & LifecycleObject & CoreObject & Asset & ItAsset {
    # BasicObject
    "Uniquely identifies this object."
    id: ID!
    "Identifies the identifier defined by the standard."
    standard_id: String!
    "Identifies the type of the Object."
    entity_type: String!
    "Identifies the parent types of this object."
    parent_types: [String]!
    # CoreObject
    created: DateTime!
    modified: DateTime!
    labels: [String]
    # Asset
    asset_id: String
    name: String!
    description: String
    locations: [AssetLocation]
    external_references( first: Int ): CyioExternalReferenceConnection
    notes( first: Int ): CyioNoteConnection
    # ItAsset
    asset_tag: String
    asset_type: AssetType!
    serial_number: String
    vendor_name: String
    version: String
    release_date: DateTime
    implementation_point: ImplementationPoint!
    operational_status: OperationalStatus!
    # responsible_parties: [ResponsibleParty]
    # HardwareAsset
    cpe_identifier: String
    installation_id: String
    installed_hardware: [ComputingDeviceAsset!]!
    installed_operating_system: OperatingSystemAsset!
    model: String
    motherboard_id: String
    baseline_configuration_name: String
    function: String
    # Computing Device
    bios_id: String
    connected_to_network: NetworkAsset
    default_gateway: String
    fqdn: String
    hostname: String
    netbios_name: String
    installed_software: [SoftwareAsset!]!
    ip_address: [IpAddress!]!
    mac_address: [MAC!]!
    vlan_id: String
    uri: String
    ports: [PortInfo!]!
    is_publicly_accessible: Boolean
    is_scanned: Boolean
    is_virtual: Boolean
  }

  # Mutation Types
  input ComputingDeviceAssetAddInput {
    labels: [String]
    # Asset
    asset_id: String
    name: String!
    description: String
    # ItAsset
    asset_tag: String
    asset_type: AssetType!
    serial_number: String
    vendor_name: String
    version: String
    release_date: DateTime
    implementation_point: ImplementationPoint!
    operational_status: OperationalStatus!
    # responsible_parties: [ResponsibleParty]
    # HardwareAsset
    cpe_identifier: String
    installation_id: String
    model: String
    motherboard_id: String
    baseline_configuration_name: String
    function: String
    # Computing Device
    bios_id: String
    default_gateway: String
    fqdn: String
    hostname: String
    netbios_name: String
    ipv4_address: [IpV4AddressAddInput]!
    ipv6_address: [IpV6AddressAddInput]!
    mac_address: [MAC!]!
    network_id: String
    vlan_id: String
    uri: URL
    ports: [PortInfoAddInput!]!
    is_publicly_accessible: Boolean
    is_scanned: Boolean
    is_virtual: Boolean
  }

  enum ComputingDeviceAssetOrdering {
    name
    asset_type
    asset_id
    ip_address
    installed_operating_system
    network_id
    labels
  }

  enum ComputingDeviceAssetFilter {
    name
    asset_type
    asset_id
    ip_address
    installed_operating_system
    network_id
    labels
  }

  input ComputingDeviceAssetFiltering {
    key: ComputingDeviceAssetFilter!
    values: [String]
    operator: String
    filterMode: FilterMode 
  }

  # Pagination Types
  type ComputingDeviceAssetConnection {
    pageInfo: PageInfo!
    edges: [ComputingDeviceAssetEdge]
  }

  type ComputingDeviceAssetEdge {
    cursor: String!
    node: ComputingDeviceAsset!
  }

`;

export default typeDefs ;
