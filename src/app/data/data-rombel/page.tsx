"use client";

import UserMasterDataTable from "../components/UserMasterDataTable";

export default function DataRombelUserPage() {
	return (
		<UserMasterDataTable
			title="Data Rombel"
			description="Data rombel per kecamatan berdasarkan data yang sama dengan halaman admin."
			endpoint="/api/data/rombel-per-kecamatan"
			valueKey="total_rombel"
			valueLabel="Total Rombel"
		/>
	);
}
