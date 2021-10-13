import gql from 'graphql-tag' ;

const typeDefs = gql`
  # Query Extensions
  extend type Query {
    softwareAssetList(
        first: Int
        offset: Int
        orderedBy: SoftwareAssetOrdering
        orderMode: OrderingMode
        filters: [SoftwareAssetFiltering]
        filterMode: FilterMode
        search: String
      ): SoftwareAssetConnection
    softwareAsset(id: ID!): SoftwareAsset
  }

  extend type Mutation {
    createSoftwareAsset(input: SoftwareAssetAddInput): SoftwareAsset
    deleteSoftwareAsset(id: ID!): String!
    editSoftwareAsset(id: ID!, input: [EditInput]!, commitMessage: String): SoftwareAsset
    createOperatingSystemAsset(input: OperatingSystemAssetAddInput): OperatingSystemAsset
    deleteOperatingSystemAsset(id: ID!): String!
    editOperatingSystemAsset(id: ID!, input: [EditInput]!, commitMessage: String): OperatingSystemAsset
    createApplicationSoftwareAsset(input: OperatingSystemAssetAddInput): ApplicationSoftwareAsset
    deleteApplicationSoftwareAsset(id: ID!): String!
    editApplicationSoftwareAsset(id: ID!, input: [EditInput]!, commitMessage: String): ApplicationSoftwareAsset
  }


  # Query Types
  "Defines identifying information about an instance of software."
  type SoftwareAsset implements BasicObject & LifecycleObject & CoreObject & Asset & ItAsset {
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
    # SoftwareAsset
    function: String
    cpe_identifier: String
    software_identifier: String
    patch_level: String
    installation_id: String
    license_key: String
  }

  "Defines identifying information about an instance of operating system software."
  type OperatingSystemAsset implements BasicObject & LifecycleObject & CoreObject & Asset & ItAsset {
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
    # SoftwareAsset
    function: String
    cpe_identifier: String
    software_identifier: String
    patch_level: String
    installation_id: String
    license_key: String
    # Operating SystemAsset
    family: FamilyType
  }

  "Defines identifying information about an instance of application software."
  type ApplicationSoftwareAsset implements BasicObject & LifecycleObject & CoreObject & Asset & ItAsset {
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
    # SoftwareAsset
    function: String
    cpe_identifier: String
    software_identifier: String
    patch_level: String
    installation_id: String
    license_key: String
  }

  # Mutation Types
  input SoftwareAssetAddInput {
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
    # SoftwareAsset
    function: String
    cpe_identifier: String
    software_identifier: String
    patch_level: String
    installation_id: String
    license_key: String
  }

  input OperatingSystemAssetAddInput {
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
    # SoftwareAsset
    function: String
    cpe_identifier: String
    software_identifier: String
    patch_level: String
    installation_id: String
    license_key: String
    # Operating SystemAsset
    family: FamilyType
  }

  input ApplicationSoftwareAssetAddInput {
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
    # SoftwareAsset
    function: String
    cpe_identifier: String
    software_identifier: String
    patch_level: String
    installation_id: String
    license_key: String
  }

  enum FamilyType {
    windows
    linux
    macOS
    other
  }

  # Pagination Types
  type SoftwareAssetConnection {
    pageInfo: PageInfo!
    edges: [SoftwareAssetEdge]
  }

  type SoftwareAssetEdge {
    cursor: String!
    node: SoftwareAsset!
  }

  input SoftwareAssetFiltering {
    key: SoftwareAssetFilter!
    values: [String]
    operator: String
    filterMode: FilterMode 
  }

  enum SoftwareAssetOrdering {
    name
    asset_type
    asset_id
    labels
  }

  enum SoftwareAssetFilter {
    name
    asset_type
    asset_id
    labels
  }

`;

export default typeDefs ;