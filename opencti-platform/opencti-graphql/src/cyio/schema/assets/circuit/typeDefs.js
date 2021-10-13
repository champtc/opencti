import gql from 'graphql-tag' ;

const typeDefs = gql`
  "Defines identifying information about an instance of a network circuit."
  type CircuitAsset implements BasicObject & LifecycleObject & CoreObject & Asset & ItAsset {
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
    # Circuit
    network_termination_point: NetworkAsset
    service_provider: Organization
    termination_device: ComputingDeviceAsset
  }
`;

export default typeDefs ;